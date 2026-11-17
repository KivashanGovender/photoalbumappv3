import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

type R2Config = {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
};

function getR2Config(): R2Config | null {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET_NAME;

  if (!accountId || !accessKeyId || !secretAccessKey || !bucket) {
    return null;
  }

  return { accountId, accessKeyId, secretAccessKey, bucket };
}

function createR2Client(config: R2Config) {
  return new S3Client({
    region: "auto",
    endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
}

export function isR2Configured() {
  return getR2Config() !== null;
}

export async function uploadToR2(key: string, body: Buffer, contentType: string) {
  const config = getR2Config();

  if (!config) {
    throw new Error("Cloudflare R2 is not configured.");
  }

  const client = createR2Client(config);

  await client.send(
    new PutObjectCommand({
      Bucket: config.bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
}

export async function readFromR2(key: string) {
  if (key.includes("..") || key.startsWith("/")) {
    throw new Error("That photo path is not valid.");
  }

  const config = getR2Config();

  if (!config) {
    throw new Error("Cloudflare R2 is not configured.");
  }

  const client = createR2Client(config);
  let result;

  try {
    result = await client.send(
      new GetObjectCommand({
        Bucket: config.bucket,
        Key: key,
      }),
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown R2 error.";
    throw new Error(`R2 image download failed: ${message}`);
  }
  const bytes = await result.Body?.transformToByteArray();

  if (!bytes || bytes.length === 0) {
    throw new Error("The photo file was empty.");
  }

  return {
    bytes,
    contentType: result.ContentType || contentTypeFromKey(key),
  };
}

function contentTypeFromKey(key: string) {
  const extension = key.split(".").pop()?.toLowerCase();

  if (extension === "png") return "image/png";
  if (extension === "webp") return "image/webp";
  if (extension === "mp4") return "video/mp4";
  if (extension === "mov") return "video/quicktime";
  return "image/jpeg";
}

export async function deleteFromR2(key: string) {
  const config = getR2Config();

  if (!config) {
    return;
  }

  const client = createR2Client(config);

  await client.send(
    new DeleteObjectCommand({
      Bucket: config.bucket,
      Key: key,
    }),
  );
}
