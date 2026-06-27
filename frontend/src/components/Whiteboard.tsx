import { Tldraw, type Editor } from 'tldraw';
import 'tldraw/tldraw.css';
import { type BoardEditor, useBoardStore } from '../state/board';

const AUTOSAVE_DELAY_MS = 800;

export function Whiteboard() {
  const setEditor = useBoardStore((state) => state.setEditor);

  return (
    <div className="h-[70vh] w-full overflow-hidden rounded-lg border border-zinc-800">
      <Tldraw
        persistenceKey="muse-board"
        onMount={(editor: Editor) => {
          editor.updateInstanceState({ isGridMode: true });
          setEditor(editor as unknown as BoardEditor);

          let timer: ReturnType<typeof setTimeout> | undefined;
          const unlisten = editor.store.listen(
            () => {
              clearTimeout(timer);
              timer = setTimeout(() => {
                void useBoardStore.getState().save();
              }, AUTOSAVE_DELAY_MS);
            },
            { scope: 'document', source: 'user' },
          );

          return () => {
            clearTimeout(timer);
            unlisten();
            setEditor(null);
          };
        }}
      />
    </div>
  );
}
