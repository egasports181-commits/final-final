import { S3Client } from "@aws-sdk/client-s3";

let client: S3Client | undefined;

export function r2Bucket(): string {
  return process.env.R2_BUCKET_NAME || "upflit";
}

export function r2PublicUrl(): string {
  return (process.env.R2_PUBLIC_URL || "").replace(/\/+$/, "");
}

export function r2Client(): S3Client {
  if (client) return client;

  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error("Missing Cloudflare R2 credentials.");
  }

  client = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });

  return client;
}
