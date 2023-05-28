import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useState } from 'react';
import ReactQuill, { Quill } from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Scrollbars } from 'react-custom-scrollbars-2';
import { db } from './Data';
import './NoteEditor.less';
import { Button } from 'antd';
import { DesktopOutlined, LeftOutlined } from '@ant-design/icons';
import { trackClick } from './tracker';

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
  trackClick('install_desktop', '安装桌面版');
  // 调用prompt()方法触发安装弹窗
  deferredPrompt.prompt();
  deferredPrompt = null;
}

function getParentBtn(ele: any): any {
  if (ele?.className.includes && ele.className?.includes('ql-')) {
    return ele;
  }
  if (ele?.parentElement) {
    return getParentBtn(ele?.parentElement);
  }
  return null;
}

const Block = Quill.import('blots/block');
class JSONBlot extends Block {}
JSONBlot.blotName = 'json';
Quill.register('formats/json', JSONBlot);

import QuillMarkdown from 'quilljs-markdown';
import 'quilljs-markdown/dist/quilljs-markdown-common-style.css'; // recommend import css, @option improve common style
Quill.register('modules/QuillMarkdown', QuillMarkdown, true);

class NoteReactQuill extends ReactQuill {
  quillMarkdown: any;

  getEditorConfig(): ReactQuill.QuillOptions {
    const m = super.getEditorConfig();
    return {
      ...m,
      debug: location.hostname === 'localhost' ? undefined : 'false',
      modules: {
        ...m.modules,
        toolbar: '.editToolbar',
      },
    };
  }

  hookEditor(editor: any): void {
    const markdownOptions = {};
    // markdown is enabled
    this.quillMarkdown = new QuillMarkdown(editor, markdownOptions);
    super.hookEditor(editor);
  }

  unhookEditor(editor: any): void {
    super.unhookEditor(editor);
    // markdown is now disabled
    this.quillMarkdown.destroy();
  }

  renderEditingArea(): JSX.Element {
    const properties = {
      key: this.state.generation,
      ref: (instance: React.ReactInstance | null) => {
        this.editingArea = instance;
      },
    };
    return (
      <div className="ipfs-editor">
        <div
          className="editToolbar"
          onClick={(e) => {
            const btn = getParentBtn(e.target);
            const name =
              btn?.className
                .split(' ')
                .find((key: string) => key.startsWith('ql-')) ||
              'edit_tool_unknown';
            trackClick(
              name,
              name.split('ql-')[1] || name,
              btn?.getAttribute('value') || btn?.getAttribute('data-value')
            );
          }}
        >
          <span className="ql-formats">
            <LeftOutlined
              className="showmenu ql-showmenu"
              title="目录列表"
              onClick={() => {
                db.switchMenuVisible();
              }}
            />
            <select className="ql-header">
              {/* <option value="1"></option>
              <option value="2"></option>
              <option value="3"></option>
              <option value=""></option> */}
            </select>

            <select className="ql-color">
              {/* <option value="#ff7473"></option>
              <option value="#f9c00c"></option>
              <option value="#79bd9a"></option>
              <option value="#47b8e0"></option>
              <option value="#263959"></option>
              <option value="#d0d1d2"></option>
              <option value=""></option> */}
            </select>
            <select className="ql-background">
              {/* <option value="#ff7473"></option>
              <option value="#f9c00c"></option>
              <option value="#79bd9a"></option>
              <option value="#47b8e0"></option>
              <option value="#263959"></option>
              <option value="#d0d1d2"></option>
              <option value=""></option> */}
            </select>

            <button type="button" className="ql-bold"></button>
            <button type="button" className="ql-italic"></button>
            <button type="button" className="ql-strike"></button>
            <button type="button" className="ql-underline"></button>
            <button type="button" className="ql-link"></button>
            <button type="button" className="ql-image"></button>
            {/* <button type="button" className="ql-video"></button> */}
            <button type="button" className="ql-blockquote"></button>
            <button type="button" className="ql-code-block"></button>

            <button type="button" className="ql-list" value="ordered"></button>
            <button type="button" className="ql-list" value="bullet"></button>
            <button type="button" className="ql-indent" value="-1"></button>
            <button type="button" className="ql-indent" value="+1"></button>

            <select className="ql-size"></select>

            <button type="button" className="ql-json"></button>
            <button type="button" className="ql-clean"></button>

            <Button
              title="点击安装桌面版"
              className="pwsinstall ql-installpws"
              id="pwsinstallql"
              style={{ display: deferredPrompt ? 'inline-block' : 'none' }}
              icon={<DesktopOutlined />}
              onClick={() => addToDesktop()}
            ></Button>
          </span>
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
      !startEditing ||
      content === activeNote?.content
    ) {
      return;
    }
    // trackClick('update_note', '更新文本', { content, id: activeNote?.id });
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
      onFocus={() => {
        trackClick('start_note', '开始编辑', activeNote);
      }}
      onBlur={(currentSelection, source, editor) => {
        if (source === 'user') trackClick('stop_note', '结束编辑', activeNote);
        source === 'user' && stopEdit(editor.getHTML());
      }}
    ></NoteReactQuill>
  );
}
