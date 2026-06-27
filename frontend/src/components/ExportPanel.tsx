import { useExportStore } from '../state/exporter';

export function ExportPanel() {
  const status = useExportStore((state) => state.status);
  const error = useExportStore((state) => state.error);
  const run = useExportStore((state) => state.run);
  const loading = status === 'loading';

  return (
    <section aria-label="Export" className="space-y-3">
      <h2 className="text-lg font-medium">Export</h2>
      <p className="text-sm text-zinc-500">
        Synthesize the kept references into a portable bundle (palette, tokens, brief, prompt, and
        the board) and download it as a zip.
      </p>
      <button
        type="button"
        onClick={() => void run()}
        disabled={loading}
        aria-label="Export bundle"
        className="rounded-lg bg-indigo-500 px-4 py-2 font-medium text-zinc-950 transition hover:bg-indigo-400 disabled:opacity-40"
      >
        {loading ? 'Preparing…' : 'Export bundle'}
      </button>

      {status === 'success' && (
        <p role="status" className="text-emerald-400">
          Bundle downloaded.
        </p>
      )}
      {status === 'error' && (
        <p role="alert" className="text-red-400">
          {error ?? 'Export failed'}
        </p>
      )}
    </section>
  );
}
