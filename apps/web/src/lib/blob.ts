import { put, del, list } from "@vercel/blob";

export async function uploadImage(file: File, userId: string) {
  const filename = `${userId}/${Date.now()}-${file.name}`;

  const blob = await put(filename, file, {
    access: "public",
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });

  return blob;
}

export async function deleteImage(url: string) {
  await del(url, {
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });
}

export async function getUserImages(userId: string) {
  const { blobs } = await list({
    prefix: `${userId}/`,
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });

  return blobs;
}
