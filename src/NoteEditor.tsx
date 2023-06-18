import { useLiveQuery } from 'dexie-react-hooks';
import { createRef, useEffect, useState } from 'react';
import ReactQuill, { Quill } from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Scrollbars } from 'react-custom-scrollbars-2';
import { db } from './Data';
import './NoteEditor.less';
import { Button, Popover, notification } from 'antd';
import {
  DesktopOutlined,
  LeftOutlined,
  MenuOutlined,
  QuestionCircleOutlined,
  TableOutlined,
} from '@ant-design/icons';
import { trackClick } from './tracker';
// import QuillMarkdown from 'quilljs-markdown';
// import 'quilljs-markdown/dist/quilljs-markdown-common-style.css'; // recommend import css, @option improve common style
import TableModule from 'quill1-table';
import { NotificationInstance } from 'antd/es/notification/interface';
import { openDev } from './utils';

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
  showInstallTip();
});

// 安装完成后触发,即点击安装弹窗中的“安装”后被触发
window.addEventListener('appinstalled', () => {
  deferredPrompt = null;
});

function addToDesktop(firstOpen = false) {
  trackClick('install_desktop', '安装桌面版', firstOpen);
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

// register module
Quill.register('modules/table', TableModule);
// Quill.register('modules/QuillMarkdown', QuillMarkdown, true);

let isFirstShow = false;

class NoteReactQuill extends ReactQuill {
  // quillMarkdown: any;
  ready = false;
  tableToolbarSetupped = false;
  scrollbars = createRef<Scrollbars>();
  tableeditor = createRef<any>();

  getEditorConfig(): ReactQuill.QuillOptions {
    const m = super.getEditorConfig();
    return {
      ...m,
      debug: location.hostname === 'localhost' ? undefined : 'false',
      modules: {
        ...m.modules,
        toolbar: '.editToolbar',
        table: true,
      },
    };
  }

  componentDidMount(): void {
    super.componentDidMount();
    Promise.resolve().then(() => this.watchTableBtns());
  }

  hookEditor(editor: any): void {
    const markdownOptions = {};
    // markdown is enabled
    // this.quillMarkdown = new QuillMarkdown(editor, markdownOptions);
    super.hookEditor(editor);
  }

  unhookEditor(editor: any): void {
    super.unhookEditor(editor);
    // markdown is now disabled
    // this.quillMarkdown.destroy();
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

            {/* <Button
              title="插入一个表格"
              className="inserttable"
              id="inserttable"
              type="link"
              icon={<TableOutlined />}
              onClick={() => this.insertTable()}
            ></Button> */}
            <button type="button" className="ql-table" value="newtable_3_3">
              <TableOutlined />
            </button>
            {/* <button type="button" className="ql-table" value="insert"></button> */}

            <button type="button" className="ql-list" value="ordered"></button>
            <button type="button" className="ql-list" value="bullet"></button>
            <button type="button" className="ql-indent" value="-1"></button>
            <button type="button" className="ql-indent" value="+1"></button>

            {/* <select className="ql-size"></select> */}

            {/* <Button
              title="JSON格式化"
              className="jsonformatter"
              id="jsonformatter"
              type="link"
              icon={
                <svg
                  className="jsonicon"
                  viewBox="0 0 1024 1024"
                  version="1.1"
                  xmlns="http://www.w3.org/2000/svg"
                  p-id="3481"
                  width="200"
                  height="200"
                >
                  <path
                    d="M213.333333 128h85.333334v85.333333H213.333333v213.333334a85.333333 85.333333 0 0 1-85.333333 85.333333 85.333333 85.333333 0 0 1 85.333333 85.333333v213.333334h85.333334v85.333333H213.333333c-45.653333-11.52-85.333333-38.4-85.333333-85.333333v-170.666667a85.333333 85.333333 0 0 0-85.333333-85.333333H0v-85.333334h42.666667a85.333333 85.333333 0 0 0 85.333333-85.333333V213.333333a85.333333 85.333333 0 0 1 85.333333-85.333333m597.333334 0a85.333333 85.333333 0 0 1 85.333333 85.333333v170.666667a85.333333 85.333333 0 0 0 85.333333 85.333333h42.666667v85.333334h-42.666667a85.333333 85.333333 0 0 0-85.333333 85.333333v170.666667a85.333333 85.333333 0 0 1-85.333333 85.333333h-85.333334v-85.333333h85.333334v-213.333334a85.333333 85.333333 0 0 1 85.333333-85.333333 85.333333 85.333333 0 0 1-85.333333-85.333333V213.333333h-85.333334V128h85.333334m-298.666667 512a42.666667 42.666667 0 0 1 42.666667 42.666667 42.666667 42.666667 0 0 1-42.666667 42.666666 42.666667 42.666667 0 0 1-42.666667-42.666666 42.666667 42.666667 0 0 1 42.666667-42.666667m-170.666667 0a42.666667 42.666667 0 0 1 42.666667 42.666667 42.666667 42.666667 0 0 1-42.666667 42.666666 42.666667 42.666667 0 0 1-42.666666-42.666666 42.666667 42.666667 0 0 1 42.666666-42.666667m341.333334 0a42.666667 42.666667 0 0 1 42.666666 42.666667 42.666667 42.666667 0 0 1-42.666666 42.666666 42.666667 42.666667 0 0 1-42.666667-42.666666 42.666667 42.666667 0 0 1 42.666667-42.666667z"
                    fill=""
                    p-id="3482"
                  ></path>
                </svg>
              }
              onClick={() => this.formatJson()}
            ></Button> */}
            <button type="button" className="ql-clean"></button>

            <Button
              title="点击安装桌面版"
              className="pwsinstall"
              type="link"
              id="pwsinstallql"
              style={{ display: deferredPrompt ? 'inline-block' : 'none' }}
              icon={<DesktopOutlined />}
              onClick={() => addToDesktop()}
            ></Button>

            <Button
              title="社区讨论"
              icon={<QuestionCircleOutlined />}
              onClick={() => openDev('category/2/产品讨论')}
            ></Button>
          </span>
        </div>
        <div className="editContainer">
          <Scrollbars autoHide ref={this.scrollbars}>
            <Popover
              className={'tableeditor'}
              ref={this.tableeditor}
              trigger="click"
              // placement="topRight"
              afterOpenChange={() => this.setupTableToolbar()}
              content={
                <div
                  className="tablebtns"
                  onClick={() => {
                    this.showTableEditor(
                      document.querySelector('.td-q.ql-cell-selected')
                    );
                  }}
                >
                  <button
                    type="button"
                    className="ql-table"
                    value="append-row-above"
                  >
                    上方插入行
                  </button>
                  <button
                    type="button"
                    className="ql-table"
                    value="append-row-below"
                  >
                    下面插入行
                  </button>
                  <button
                    type="button"
                    className="ql-table"
                    value="append-col-before"
                  >
                    左侧插入列
                  </button>
                  <button
                    type="button"
                    className="ql-table"
                    value="append-col-after"
                  >
                    右侧插入列
                  </button>
                  <button type="button" className="ql-table" value="remove-col">
                    删除列
                  </button>
                  <button type="button" className="ql-table" value="remove-row">
                    删除行
                  </button>
                  <button
                    type="button"
                    className="ql-table"
                    value="remove-table"
                  >
                    删除整个表格
                  </button>
                  <button type="button" className="ql-table" value="split-cell">
                    拆分单元格
                  </button>
                  <button
                    type="button"
                    className="ql-table"
                    value="merge-selection"
                  >
                    合并单元格
                  </button>
                  <button
                    type="button"
                    className="ql-table"
                    value="remove-cell"
                  >
                    删除单元格
                  </button>
                  {/* <button type="button" className="ql-table" value="remove-selection"></button> */}
                  <button type="button" className="ql-table" value="undo">
                    回退
                  </button>
                  <button type="button" className="ql-table" value="redo">
                    重做
                  </button>
                </div>
              }
              arrow={false}
            >
              <MenuOutlined />
            </Popover>
            <div className="editContainerContent" {...properties}></div>
          </Scrollbars>
        </div>
      </div>
    );
  }

  setupTableToolbar() {
    if (!this.tableToolbarSetupped) {
      this.tableToolbarSetupped = true;
      const toolbar = this.editor!.getModule('toolbar');
      document
        .querySelectorAll('.tablebtns button')
        .forEach((btn: any) => toolbar.attach(btn));
    }
  }

  showTableEditor(tdTarget: HTMLElement | null) {
    const tableeditorDom = document.querySelector(
      '.tableeditor'
    ) as HTMLElement;
    const scrollbarsDom = this.scrollbars.current?.container!;
    if (tdTarget) {
      const targetRect = tdTarget.getBoundingClientRect();
      const scrollbarsRect = scrollbarsDom.getBoundingClientRect();
      const tableeditorRect = tableeditorDom.getBoundingClientRect();
      const tableLeft = parseFloat(
        window
          .getComputedStyle(document.querySelector('.ql-editor')!)
          .paddingBlockStart.replace('px', '')
      );
      tableeditorDom.style.top =
        targetRect.y +
        this.scrollbars.current!.getScrollTop() -
        scrollbarsRect.y +
        (targetRect.height - tableeditorRect.height) / 2 +
        'px';
      tableeditorDom.style.left =
        targetRect.x +
        this.scrollbars.current!.getScrollLeft() -
        scrollbarsRect.x +
        targetRect.width -
        tableLeft -
        5 +
        'px';
      tableeditorDom.style.display = 'block';
    } else {
      tableeditorDom.style.display = 'none';
    }
  }

  watchTableBtns() {
    if (!this.ready) {
      this.ready = true;
      // 下边是根据dom计算表格编辑器按钮位置
      // 需要吧编辑器放到每个选中的单元格的右侧垂直居中显示
      (this.editor as any).container.addEventListener(
        'mouseup',
        (e: MouseEvent) => {
          const tdTarget =
            (e.target as HTMLElement)?.tagName === 'TD'
              ? (e.target as HTMLElement)
              : ((e.target as any)?.parentNode as HTMLElement);
          this.showTableEditor(tdTarget.tagName === 'TD' ? tdTarget : null);
        }
      );
    }
  }

  formatJson() {}
}

let tipApi: NotificationInstance;
let startEditing = false;

function showInstallTip() {
  if (!tipApi || isFirstShow || !deferredPrompt) {
    return;
  }
  db.getOptions().then((opt) => {
    if (opt?.firstOpen !== false && !isFirstShow && deferredPrompt) {
      isFirstShow = true;
      tipApi.open({
        message: '桌面版',
        description: '可以把记事本在桌面创建一个快速启动的应用',
        duration: null,
        key: 'showInstallTip',
        btn: (
          <Button
            type="primary"
            size="small"
            onClick={() => {
              tipApi.destroy('showInstallTip');
              addToDesktop(true);
            }}
          >
            安装桌面版
          </Button>
        ),
        onClose: () => db.setFirstOpen(false),
      });
    }
  });
}

export default function () {
  const activeNote = useLiveQuery(() => db.getActiveNote());
  const [value, setValue] = useState(activeNote?.content);
  const [api, contextHolder] = notification.useNotification();

  useEffect(() => setValue(activeNote?.content), [activeNote?.id]);

  useEffect(() => {
    tipApi = api;
    showInstallTip();
  }, []);

  async function updateNote(
    content: string = value!,
    delta?: any,
    source?: string
  ) {
    if (
      (!activeNote && !content) ||
      (!startEditing && source !== 'user') ||
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
    <>
      <NoteReactQuill
        key={activeNote?.id}
        value={value}
        theme="snow"
        onChange={updateNote}
        onKeyDown={startEdit}
        onFocus={() => {
          trackClick('start_note', '开始编辑', activeNote?.id);
        }}
        onBlur={(currentSelection, source, editor) => {
          if (source === 'user')
            trackClick('stop_note', '结束编辑', activeNote?.id);
          source === 'user' && stopEdit(editor.getHTML());
        }}
      ></NoteReactQuill>
      {contextHolder}
    </>
  );
}
