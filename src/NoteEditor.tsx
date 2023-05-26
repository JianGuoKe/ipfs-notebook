import { useLiveQuery } from 'dexie-react-hooks';
import { ErrorInfo, useEffect, useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Scrollbars } from 'react-custom-scrollbars-2';
import { db } from './Data';
import './NoteEditor.less';
import { Button } from 'antd';
import { DesktopOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import { getBrowserWidth } from './utils';

let deferredPrompt: any = null;

// 判断用户是否安装此应用：beforeinstallprompt,如果用户已经安装过了,那么该事件不会再次触发
// 需要卸载，然后重新打开浏览器才能再次触发
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  const pwa = document.querySelector('#pwsinstallql') as any;
  if (pwa) {
    pwa.style.display = 'inline-block';
  }
});

// 安装完成后触发,即点击安装弹窗中的“安装”后被触发
window.addEventListener('appinstalled', () => {
  deferredPrompt = null;
});

function addToDesktop() {
  // 调用prompt()方法触发安装弹窗
  deferredPrompt.prompt();
  deferredPrompt = null;
}

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
    const size = getBrowserWidth();
    return (
      <div className="ipfs-editor">
        <div className="editToolbar">
          <span className="ql-formats">
            <span
              className="showmenu"
              title="目录列表"
              onClick={() => db.switchMenuVisible()}
            >
              <MenuUnfoldOutlined />
            </span>
            <select className="ql-header">
              <option value="1"></option>
              <option value="2"></option>
              <option value="3"></option>
              <option value=""></option>
            </select>
          </span>
          {size === 'xs' && (
            <span className="ql-formats">
              <button
                type="button"
                className="ql-list"
                value="ordered"
              ></button>
              <button type="button" className="ql-list" value="bullet"></button>
              <button type="button" className="ql-indent" value="-1"></button>
              <button type="button" className="ql-indent" value="+1"></button>
            </span>
          )}
          {size === 'xs' && (
            <span className="ql-formats">
              <button type="button" className="ql-clean"></button>
            </span>
          )}

          {size === 'xs' && (
            <span
              className="ql-formats"
              id="pwsinstallql"
              style={{ display: deferredPrompt ? 'inline-block' : 'none' }}
            >
              <Button
                title="点击安装桌面版"
                className="pwsinstall"
                icon={<DesktopOutlined />}
                onClick={() => addToDesktop()}
              ></Button>
            </span>
          )}
          <span className="ql-formats">
            <select className="ql-color">
              <option value="#ff7473"></option>
              <option value="#f9c00c"></option>
              <option value="#79bd9a"></option>
              <option value="#47b8e0"></option>
              <option value="#263959"></option>
              <option value="#d0d1d2"></option>
              <option value=""></option>
            </select>
            <button type="button" className="ql-bold"></button>
            <button type="button" className="ql-italic"></button>
            <button type="button" className="ql-strike"></button>
            <button type="button" className="ql-underline"></button>
            <button type="button" className="ql-link"></button>
            <button type="button" className="ql-image"></button>
            <button type="button" className="ql-blockquote"></button>

            <select className="ql-size"></select>
          </span>
          {size !== 'xs' && (
            <span className="ql-formats">
              <button
                type="button"
                className="ql-list"
                value="ordered"
              ></button>
              <button type="button" className="ql-list" value="bullet"></button>
              <button type="button" className="ql-indent" value="-1"></button>
              <button type="button" className="ql-indent" value="+1"></button>
            </span>
          )}
          {size !== 'xs' && (
            <span className="ql-formats">
              <button type="button" className="ql-clean"></button>
            </span>
          )}

          {size !== 'xs' && (
            <span
              className="ql-formats"
              id="pwsinstallql"
              style={{ display: deferredPrompt ? 'inline-block' : 'none' }}
            >
              <Button
                title="点击安装桌面版"
                className="pwsinstall"
                icon={<DesktopOutlined />}
                onClick={() => addToDesktop()}
              ></Button>
            </span>
          )}
        </div>
        <div className="editContainer">
          <Scrollbars autoHide>
            <div className="editContainerContent" {...properties}></div>
          </Scrollbars>
        </div>
      </div>
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
      (!startEditing && content === activeNote?.content)
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
      onKeyDown={startEdit}
      onBlur={(currentSelection, source, editor) =>
        source === 'user' && stopEdit(editor.getHTML())
      }
    ></NoteReactQuill>
  );
}
