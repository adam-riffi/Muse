import { Tldraw, type Editor } from 'tldraw';
import 'tldraw/tldraw.css';
import { type BoardEditor, useBoardStore } from '../state/board';

export function Whiteboard() {
  const setEditor = useBoardStore((state) => state.setEditor);

  return (
    <div className="h-[70vh] w-full overflow-hidden rounded-lg border border-zinc-800">
      <Tldraw
        persistenceKey="muse-board"
        onMount={(editor: Editor) => {
          editor.updateInstanceState({ isGridMode: true });
          setEditor(editor as unknown as BoardEditor);
          return () => {
            setEditor(null);
          };
        }}
      />
    </div>
  );
}
