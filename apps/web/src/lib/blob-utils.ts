export function getBlobProxyUrl(blobUrl: string): string {
  if (!blobUrl.includes(".vercel-storage.com")) {
    return blobUrl;
  }

  const url = new URL(blobUrl);
  const pathSegments = url.pathname.split("/").filter(Boolean);
  const encodedPath = pathSegments
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  if (blobUrl.includes(".private.")) {
    return `/api/blob/${encodedPath}`;
  }

  return blobUrl;
}
