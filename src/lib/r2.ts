import { DeleteObjectCommand, ListObjectsV2Command, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

let client: S3Client | null = null;

function config() {
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

export function getR2Client() {
  if (client) return client;
  const { accountId, accessKeyId, secretAccessKey } = config();
  client = new S3Client({
    region: "auto",
    endpoint: "https://" + accountId + ".r2.cloudflarestorage.com",
    credentials: { accessKeyId, secretAccessKey },
    forcePathStyle: true,
  });
  return client;
}

export function getR2PublicUrl(key: string) {
  const { publicUrl } = config();
  return publicUrl + "/" + key.split("/").map(encodeURIComponent).join("/");
}

export async function createR2UploadUrl(input: { key: string; contentType: string }) {
  const { bucket } = config();
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: input.key,
    ContentType: input.contentType,
    CacheControl: "public, max-age=31536000, immutable",
  });
  return getSignedUrl(getR2Client(), command, { expiresIn: 300 });
}

export async function putR2Object(input: { key: string; body: Buffer; contentType: string }) {
  const { bucket } = config();
  await getR2Client().send(new PutObjectCommand({
    Bucket: bucket,
    Key: input.key,
    Body: input.body,
    ContentType: input.contentType,
    CacheControl: "public, max-age=31536000, immutable",
  }));
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

export type R2MediaObject = { key: string; filename: string; size: number; lastModified: string | null; url: string };

export async function listR2Objects(): Promise<R2MediaObject[]> {
  const { bucket } = config();
  const objects: R2MediaObject[] = [];
  let continuationToken: string | undefined;
  do {
    const page = await getR2Client().send(new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: "portfolio/",
      ContinuationToken: continuationToken,
      MaxKeys: 1000,
    }));
    for (const item of page.Contents ?? []) {
      if (!item.Key || item.Key.endsWith("/")) continue;
      const filename = item.Key.split("/").pop() || item.Key;
      objects.push({
        key: item.Key,
        filename,
        size: item.Size ?? 0,
        lastModified: item.LastModified?.toISOString() ?? null,
        url: getR2PublicUrl(item.Key),
      });
    }
    continuationToken = page.IsTruncated ? page.NextContinuationToken : undefined;
  } while (continuationToken);
  return objects.sort((a, b) => (b.lastModified || "").localeCompare(a.lastModified || ""));
}

export async function deleteR2Object(key: string) {
  const { bucket } = config();
  await getR2Client().send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}
