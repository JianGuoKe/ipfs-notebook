import React, { useEffect, useState } from 'react';
import { Layout, Button, Drawer, Modal, Avatar } from 'antd';
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
import { getBrowserWidth } from './utils';
const { Content } = Layout;

export default function NoteBook(): React.ReactElement {
  const options = useLiveQuery(() => db.getOptions());
  const [openPPK, setOpenPPK] = useState(false);
  const [createBook, setCreateBook] = useState('add');
  const [openBook, setOpenBook] = useState(false);
  const [openSettings, setOpenSettings] = useState(false);
  const [size, setSize] = useState(getBrowserWidth());
  const nokey = useLiveQuery(
    async () => !((await db.keys.count()) > 0) && !!(await db.getActaiveNode())
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

    function setWidth() {
      setSize(getBrowserWidth());
    }

    window.addEventListener('resize', setWidth);
    return () => {
      window.removeEventListener('resize', setWidth);
    };
  }, []);

  return (
    <>
      {size !== 'xs' && (
        <Layout hasSider={true} className="ipfs-notebook">
          {options?.bookVisible !== false && (
            <DragSider
              defaultWidth={options?.bookWidth}
              onClose={() => db.setBookVisible(false)}
              onWidthChange={(width) => db.setBookWidth(width)}
              className="ipfs-notebook-books"
            >
              <BookMenu
                addVisible={openBook}
                onCreateBook={showBookModal}
                onSetting={showDrawer}
              ></BookMenu>
            </DragSider>
          )}
          <Layout hasSider={true}>
            {options?.menuVisible !== false && (
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
            )}
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
            <Settings
              onPPKAdd={showModal}
              onFolderAdd={showBookModal}
            ></Settings>
          </Drawer>
        </Layout>
      )}
      {size === 'xs' && (
        <>
          <Drawer
            width={'100%'}
            title={false}
            closable={false}
            placement="left"
            onClose={() => db.setMenuVisible(false)}
            className="ipfs-notebook ipfs-notebook-drawer"
            open={options?.menuVisible === true}
          >
            <div className="ipfs-notebook-menu">
              <MenuList
                bookVisible={!!options?.bookVisible}
                onCreateBook={showBookModal}
                onBookVisibleChange={(v) => db.setBookVisible(v)}
                onMenuItemSelected={() => db.setMenuVisible(false)}
              ></MenuList>
            </div>

            <Drawer
              width={'100%'}
              title={false}
              closable={false}
              placement="left"
              onClose={() => db.setBookVisible(false)}
              className="ipfs-notebook-books ipfs-notebook-drawer-books"
              open={options?.bookVisible === true}
            >
              <BookMenu
                addVisible={openBook}
                onCreateBook={showBookModal}
                onSetting={showDrawer}
                onBookSelected={() => db.setBookVisible(false)}
              ></BookMenu>

              <Drawer
                width={'100%'}
                title="设置"
                placement="left"
                onClose={onClose}
                open={openSettings}
              >
                <Settings
                  onPPKAdd={showModal}
                  onFolderAdd={showBookModal}
                ></Settings>
              </Drawer>
            </Drawer>
          </Drawer>
          <NoteEditor></NoteEditor>
        </>
      )}
      <FolderModal
        open={openBook}
        mode={createBook}
        onClose={hideFolderModal}
      ></FolderModal>
      <PPKModal open={openPPK} onClose={hideModal}></PPKModal>
    </>
  );
}
