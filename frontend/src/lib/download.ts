// Trigger a browser download for a Blob. Guarded so it is a no-op in environments without the
// object-URL API (e.g. some test runtimes).
export function downloadBlob(blob: Blob, filename: string): void {
  if (typeof URL.createObjectURL !== 'function') {
    return;
  }
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
