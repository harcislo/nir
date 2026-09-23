import { checkObjectStorageConnection } from "../modules/files/object-storage.js";

checkObjectStorageConnection()
  .then((bucket) => {
    console.info(`Yandex Object Storage connection is ready: ${bucket}`);
  })
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });

