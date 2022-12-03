import React, { useEffect, useState } from 'react';
import { Layout, Button, Drawer } from 'antd';
import './NoteBook.less';
import DragSider from './DragSider';
import { SettingOutlined } from '@ant-design/icons';
import Settings from './Settings';
import BookMenu from './Books';
import MenuList from './Menus';
import NoteEditor from './NoteEditor';
import PPKModal from './PPKModal';
import FolderModal from './FolderModal';

const { Content } = Layout;

export default function NoteBook(): React.ReactElement {
  const [open, setOpen] = useState(false);
  const [bookVisible, setBookVisible] = useState(true);
  const [openPPK, setOpenPPK] = useState(false);
  const [openFolder, setOpenFolder] = useState(false);

  const showModal = () => {
    setOpenPPK(true);
  };

  const hideModal = () => {
    setOpenPPK(false);
  };

  const showFolderModal = () => {
    setOpenFolder(true);
  };
  const hideFolderModal = () => {
    setOpenFolder(false);
  };

  const showDrawer = () => {
    setOpen(true);
  };

  const onClose = () => {
    setOpen(false);
  };

  useEffect(() => {}, [bookVisible]);

  return (
    <>
      <Layout hasSider={true} className="ipfs-notebook">
        {bookVisible && (
          <DragSider>
            <BookMenu></BookMenu>
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
          <DragSider className="ipfs-notebook-menu" defaultWidth={300}>
            <MenuList
              bookVisible={bookVisible}
              onBookVisibleChange={setBookVisible}
            ></MenuList>
          </DragSider>
          <Content>
            <NoteEditor></NoteEditor>
          </Content>
        </Layout>
        <Drawer title="设置" placement="right" onClose={onClose} open={open}>
          <Settings
            onPPKAdd={showModal}
            onFolderAdd={showFolderModal}
          ></Settings>
        </Drawer>
      </Layout>
      <FolderModal open={openFolder} onClose={hideFolderModal}></FolderModal>
      <PPKModal open={openPPK} onClose={hideModal}></PPKModal>
    </>
  );
}
