import React, { useEffect, useState } from 'react';
import { Layout, Button, Drawer, Modal } from 'antd';
import './NoteBook.less';
import DragSider from './DragSider';
import { PlusOutlined, SettingOutlined } from '@ant-design/icons';
import Settings from './Settings';
import BookMenu from './Books';
import MenuList from './Menus';
import NoteEditor from './NoteEditor';
import PPKModal from './PPKModal';
import FolderModal from './FolderModal';
import { db } from './Data';
import { useLiveQuery } from 'dexie-react-hooks';
const { Content } = Layout;

export default function NoteBook(): React.ReactElement {
  const options = useLiveQuery(() => db.getOptions());
  const [openPPK, setOpenPPK] = useState(false);
  const [createBook, setCreateBook] = useState('add');
  const [openBook, setOpenBook] = useState(false);
  const [openSettings, setOpenSettings] = useState(false);
  const nokey = useLiveQuery(
    async () => !(await db.getActiveKey()) && !!(await db.getActaiveNode())
  );

  useEffect(() => {
    nokey && setOpenPPK(true);
  }, [nokey]);

  const showModal = () => {
    setOpenPPK(true);
  };

  const hideModal = () => {
    setOpenPPK(false);
  };

  const showBookModal = (createFolder = 'add') => {
    setCreateBook(createFolder);
    setOpenBook(true);
  };
  const hideFolderModal = () => {
    setOpenBook(false);
  };

  const showDrawer = () => {
    setOpenSettings(true);
  };

  const onClose = () => {
    setOpenSettings(false);
  };

  useEffect(() => {
    (async function () {
      if ((await db.books.count()) <= 0) {
        showBookModal('create');
      }
    })();
  }, []);

  return (
    <>
      <Layout hasSider={true} className="ipfs-notebook">
        {options?.bookVisible && (
          <DragSider
            defaultWidth={options?.bookWidth}
            onClose={() => db.setBookVisible(false)}
            onWidthChange={(width) => db.setBookWidth(width)}
            className="ipfs-notebook-books"
          >
            <BookMenu
              addVisible={openBook}
              onCreateBook={showBookModal}
            ></BookMenu>
            <div className="ipfs-notebook-add">
              <Button
                type="text"
                icon={<PlusOutlined />}
                onClick={() => showBookModal()}
              >
                添加记事本
              </Button>
            </div>
            <Button
              className="ipfs-notebook-settings"
              type="text"
              title="记事本设置"
              icon={<SettingOutlined />}
              onClick={showDrawer}
            ></Button>
          </DragSider>
        )}
        <Layout hasSider={true}>
          <DragSider
            className="ipfs-notebook-menu"
            defaultWidth={options?.menuWidth || 300}
            onWidthChange={(width) => db.setMenuWidth(width)}
            minWidth={150}
          >
            <MenuList
              bookVisible={!!options?.bookVisible}
              onCreateBook={showBookModal}
              onBookVisibleChange={(v) => db.setBookVisible(v)}
            ></MenuList>
          </DragSider>
          <Content>
            <NoteEditor></NoteEditor>
          </Content>
        </Layout>
        <Drawer
          title="设置"
          placement="right"
          onClose={onClose}
          open={openSettings}
        >
          <Settings onPPKAdd={showModal} onFolderAdd={showBookModal}></Settings>
        </Drawer>
      </Layout>
      <FolderModal
        open={openBook}
        mode={createBook}
        onClose={hideFolderModal}
      ></FolderModal>
      <PPKModal open={openPPK} onClose={hideModal}></PPKModal>
    </>
  );
}
