import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import ScrollView from 'react-custom-scrollbars';
import { db } from './Data';

class NoteReactQuill extends ReactQuill {
  getEditorConfig(): ReactQuill.QuillOptions {
    const m = super.getEditorConfig();
    return {
      ...m,
      modules: {
        ...m.modules,
        toolbar: '.editToolbar',
      },
    };
  }

  renderEditingArea(): JSX.Element {
    const properties = {
      key: this.state.generation,
      ref: (instance: React.ReactInstance | null) => {
        this.editingArea = instance;
      },
    };
    return (
      <>
        <div className="editToolbar">
          <span className="ql-formats">
            <select className="ql-header">
              <option value="1"></option>
              <option value="2"></option>
              <option value="3"></option>
              <option value=""></option>
            </select>
          </span>
          <span className="ql-formats">
            <select className="ql-color">
              <option value="red"></option>
              <option value="green"></option>
              <option value="blue"></option>
              <option value="orange"></option>
              <option value="violet"></option>
              <option value="#d0d1d2"></option>
              <option value=""></option>
            </select>
            <button type="button" className="ql-bold"></button>
            <button type="button" className="ql-italic"></button>
            <button type="button" className="ql-underline"></button>
            <button type="button" className="ql-link"></button>
          </span>
          <span className="ql-formats">
            <button type="button" className="ql-list" value="ordered"></button>
            <button type="button" className="ql-list" value="bullet"></button>
          </span>
          <span className="ql-formats">
            <button type="button" className="ql-clean"></button>
          </span>
        </div>
        <ScrollView className="editContainer" autoHide>
          <div className="editContainerContent" {...properties}></div>
        </ScrollView>
      </>
    );
  }
}

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

  function startEdit() {
    startEditing = true;
  }

  async function stopEdit(content: string) {
    await updateNote(content);
    startEditing = false;
  }

  return (
    <NoteReactQuill
      key={activeNote?.id}
      value={value}
      theme="snow"
      onChange={updateNote}
      onKeyPress={startEdit}
      onBlur={(a, b, editor) => stopEdit(editor.getHTML())}
    ></NoteReactQuill>
  );
}
