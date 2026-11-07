import { createHash, createHmac } from "node:crypto";

let cachedConfig: ReturnType<typeof readConfig> | null = null;

function readConfig() {
  const accountId = process.env.R2_ACCOUNT_ID?.trim();
  const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim();
  const bucket = process.env.R2_BUCKET_NAME?.trim();
  const publicUrl = process.env.R2_PUBLIC_URL?.trim().replace(/\/+$/, "");
  if (!accountId || !accessKeyId || !secretAccessKey || !bucket || !publicUrl) {
    throw new Error("Cloudflare R2 is not fully configured. Check the R2 environment variables.");
  }
  const publicUrlObject = new URL(publicUrl);
  if (publicUrlObject.protocol !== "https:") throw new Error("R2_PUBLIC_URL must use HTTPS.");
  return { accountId, accessKeyId, secretAccessKey, bucket, publicUrl, publicUrlObject };
}

function config() {
  return (cachedConfig ??= readConfig());
}

function sha256(value: string | Buffer) {
  return createHash("sha256").update(value).digest("hex");
}

function hmac(key: Buffer | string, value: string) {
  return createHmac("sha256", key).update(value).digest();
}

function awsEncode(value: string) {
  return encodeURIComponent(value).replace(/[!'()*]/g, (char) =>
    "%" + char.charCodeAt(0).toString(16).toUpperCase(),
  );
}

async function signedR2Request(method: "PUT" | "DELETE", key: string, body?: Buffer, contentType?: string) {
  const { accountId, accessKeyId, secretAccessKey, bucket } = config();
  const host = accountId + ".r2.cloudflarestorage.com";
  const path = "/" + awsEncode(bucket) + "/" + key.split("/").map(awsEncode).join("/");
  const url = "https://" + host + path;
  const payloadHash = sha256(body ?? Buffer.alloc(0));
  const amzDate = new Date().toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);
  const headers: Record<string, string> = {
    host,
    "x-amz-content-sha256": payloadHash,
    "x-amz-date": amzDate,
  };
  if (contentType) headers["content-type"] = contentType;
  if (method === "PUT") headers["cache-control"] = "public, max-age=31536000, immutable";

  const sortedHeaderNames = Object.keys(headers).sort();
  const canonicalHeaders = sortedHeaderNames.map((name) => name + ":" + headers[name].trim() + "\n").join("");
  const signedHeaders = sortedHeaderNames.join(";");
  const canonicalRequest = [
    method,
    path,
    "",
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join("\n");
  const scope = dateStamp + "/auto/s3/aws4_request";
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    scope,
    sha256(canonicalRequest),
  ].join("\n");

  const dateKey = hmac("AWS4" + secretAccessKey, dateStamp);
  const regionKey = hmac(dateKey, "auto");
  const serviceKey = hmac(regionKey, "s3");
  const signingKey = hmac(serviceKey, "aws4_request");
  const signature = createHmac("sha256", signingKey).update(stringToSign).digest("hex");
  const authorization = "AWS4-HMAC-SHA256 Credential=" + accessKeyId + "/" + scope +
    ", SignedHeaders=" + signedHeaders + ", Signature=" + signature;

  const requestHeaders = new Headers({
    "x-amz-content-sha256": payloadHash,
    "x-amz-date": amzDate,
    authorization,
  });
  if (contentType) requestHeaders.set("content-type", contentType);
  if (method === "PUT") requestHeaders.set("cache-control", headers["cache-control"]);

  const response = await fetch(url, {
    method,
    headers: requestHeaders,
    ...(method === "PUT" ? { body: body! } : {}),
    cache: "no-store",
  });
  if (!response.ok) {
    const detail = (await response.text()).slice(0, 500);
    throw new Error("Cloudflare R2 " + method + " failed (" + response.status + "): " + (detail || response.statusText));
  }
}

export function getR2PublicUrl(key: string) {
  const { publicUrl } = config();
  return publicUrl + "/" + key.split("/").map(encodeURIComponent).join("/");
}

export async function putR2Object(input: { key: string; body: Buffer; contentType: string }) {
  await signedR2Request("PUT", input.key, input.body, input.contentType);
  return getR2PublicUrl(input.key);
}

export function getR2KeyFromPublicUrl(value: string): string | null {
  try {
    const { publicUrlObject } = config();
    const url = new URL(value);
    if (url.origin !== publicUrlObject.origin) return null;
    const basePath = publicUrlObject.pathname.replace(/\/+$/, "");
    if (basePath && !url.pathname.startsWith(basePath + "/")) return null;
    const encodedKey = url.pathname.slice(basePath.length).replace(/^\/+/, "");
    if (!encodedKey) return null;
    const key = encodedKey.split("/").map(decodeURIComponent).join("/");
    return key.startsWith("portfolio/") ? key : null;
  } catch {
    return null;
  }
}

export async function deleteR2Object(key: string) {
  await signedR2Request("DELETE", key);
}
