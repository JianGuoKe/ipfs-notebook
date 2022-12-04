import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { db } from './Data';

let startEditing = false;
export default function () {
  const activeNote = useLiveQuery(() => db.getActiveNote());
  const [value, setValue] = useState(activeNote?.content);

  useEffect(() => setValue(activeNote?.content), [activeNote?.id]);

  async function updateNote(content: string = value!) {
    if (
      (!activeNote && !content) ||
      content === activeNote?.content ||
      !startEditing
    ) {
      return;
    }
    setValue(content);
    await db.upsertNote(content, activeNote?.id);
  }

  async function startEdit() {
    startEditing = true;
  }

  async function stopEdit(content: string) {
    await updateNote(content);
    startEditing = false;
  }

  return (
    <ReactQuill
      key={activeNote?.id}
      value={value}
      onChange={updateNote}
      onKeyPress={startEdit}
      onBlur={(a, b, editor) => stopEdit(editor.getHTML())}
    />
  );
}
