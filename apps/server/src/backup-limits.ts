export const MAX_BACKUP_BYTES = 64 * 1024 * 1024;
export const MAX_BACKUP_REQUEST_BYTES = MAX_BACKUP_BYTES + 4096;
export function serializeBoundedBackup(
  backup: unknown,
  limit = MAX_BACKUP_BYTES,
) {
  const serialized = JSON.stringify(backup);
  if (Buffer.byteLength(serialized, "utf8") > limit)
    throw Object.assign(
      new Error(
        "The complete backup exceeds the supported 64 MiB UTF-8 JSON limit. No data was removed or truncated; export individual lessons or move a full database copy while the app is stopped.",
      ),
      { status: 413, code: "BACKUP_TOO_LARGE" },
    );
  return serialized;
}
