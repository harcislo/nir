import { Readable } from "node:stream";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { config } from "../../config.js";
import { AppError } from "../../errors.js";

let client: S3Client | undefined;

function storageConfiguration() {
  const bucket = config.YANDEX_STORAGE_BUCKET;
  const accessKeyId = config.YANDEX_STORAGE_ACCESS_KEY_ID;
  const secretAccessKey = config.YANDEX_STORAGE_SECRET_ACCESS_KEY;

  if (!bucket || !accessKeyId || !secretAccessKey) {
    throw new AppError(
      503,
      "OBJECT_STORAGE_NOT_CONFIGURED",
      "Yandex Object Storage не настроен на сервере",
    );
  }

  client ??= new S3Client({
    endpoint: config.YANDEX_STORAGE_ENDPOINT,
    region: config.YANDEX_STORAGE_REGION,
    credentials: { accessKeyId, secretAccessKey },
  });

  return { client, bucket };
}

async function executeStorageOperation<T>(operation: () => Promise<T>, message: string) {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error("Yandex Object Storage operation failed", error);
    throw new AppError(502, "OBJECT_STORAGE_ERROR", message);
  }
}

export async function uploadObject(objectKey: string, body: Buffer, contentType: string) {
  const storage = storageConfiguration();
  await executeStorageOperation(
    () =>
      storage.client.send(
        new PutObjectCommand({
          Bucket: storage.bucket,
          Key: objectKey,
          Body: body,
          ContentType: contentType,
        }),
      ),
    "Не удалось сохранить файл в Object Storage",
  );
}

export async function downloadObject(objectKey: string) {
  const storage = storageConfiguration();
  const result = await executeStorageOperation(
    () =>
      storage.client.send(new GetObjectCommand({ Bucket: storage.bucket, Key: objectKey })),
    "Не удалось получить файл из Object Storage",
  );

  if (!result.Body) {
    throw new AppError(502, "OBJECT_STORAGE_EMPTY_RESPONSE", "Хранилище вернуло пустой файл");
  }

  if (result.Body instanceof Readable) return result.Body;
  return Readable.from(await result.Body.transformToByteArray());
}

export async function deleteObject(objectKey: string) {
  const storage = storageConfiguration();
  await executeStorageOperation(
    () =>
      storage.client.send(new DeleteObjectCommand({ Bucket: storage.bucket, Key: objectKey })),
    "Не удалось удалить файл из Object Storage",
  );
}

export async function checkObjectStorageConnection() {
  const storage = storageConfiguration();
  await executeStorageOperation(
    () => storage.client.send(new HeadBucketCommand({ Bucket: storage.bucket })),
    "Не удалось подключиться к бакету Yandex Object Storage",
  );
  return storage.bucket;
}
