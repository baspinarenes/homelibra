import { apiUrl } from './api-url';

/** Where the export is downloaded from: a plain HTTP download under the session, not a tRPC call. */
export const libraryExportUrl = `${apiUrl}/api/export`;

/**
 * Downloads the Library export and hands it to the browser as a file (web
 * only, #40 story 16). Fetched rather than linked, so the screen can show
 * that it is being made and say when it failed.
 */
export async function downloadLibraryExport() {
  const response = await fetch(libraryExportUrl, { credentials: 'include' });
  if (!response.ok) throw new Error(`the export failed: ${response.status}`);
  const zip = await response.blob();
  const name =
    /filename="([^"]+)"/.exec(response.headers.get('content-disposition') ?? '')?.[1] ??
    `homelibra-${new Date().toISOString().slice(0, 10)}.zip`;
  const url = URL.createObjectURL(zip);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Long enough for the browser to start saving it.
  setTimeout(() => URL.revokeObjectURL(url), 60 * 1000);
}
