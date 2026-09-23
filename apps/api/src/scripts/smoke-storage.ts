import { randomUUID } from "node:crypto";
import { deleteObject, downloadObject, uploadObject } from "../modules/files/object-storage.js";

const objectKey = `system-checks/${randomUUID()}.txt`;
const expected = Buffer.from("measurement-portal storage check\n", "utf8");

async function smokeTest() {
  await uploadObject(objectKey, expected, "text/plain; charset=utf-8");
  try {
    const stream = await downloadObject(objectKey);
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }

    const actual = Buffer.concat(chunks);
    if (!actual.equals(expected)) {
      throw new Error("Downloaded object content does not match uploaded content");
    }
  } finally {
    await deleteObject(objectKey);
  }

  console.info("Yandex Object Storage upload/download/delete check passed");
}

smokeTest().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
