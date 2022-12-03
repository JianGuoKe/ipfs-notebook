import React, { useState } from 'react';
import { Layout, MenuProps, Menu } from 'antd';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import './NoteBook.less';
import DragSider from './DragSider';
import { FolderOutlined } from '@ant-design/icons';

type MenuItem = Required<MenuProps>['items'][number];

function getItem(
  label: React.ReactNode,
  key: React.Key,
  icon?: React.ReactNode,
  children?: MenuItem[],
  type?: 'group'
): MenuItem {
  return {
    key,
    icon,
    children,
    label,
    type,
  };
}

const items: MenuProps['items'] = [
  getItem(
    'Group',
    'grp',
    null,
    [
      getItem('Option 13', '13', <FolderOutlined />),
      getItem('Option 14', '14'),
    ],
    'group'
  ),
];

const { Content } = Layout;

export default function NoteBook(): React.ReactElement {
  const [value, setValue] = useState('');

  const onClick: MenuProps['onClick'] = (e) => {
    console.log('click ', e);
  };

  return (
    <Layout hasSider={true} className="ipfs-notebook">
      <DragSider>
        <Menu
          theme="dark"
          onClick={onClick}
          defaultSelectedKeys={['1']}
          defaultOpenKeys={['sub1']}
          mode="inline"
          items={items}
        />
      </DragSider>
      <Layout>
        <Content>
          <ReactQuill value={value} onChange={setValue} />
        </Content>
      </Layout>
    </Layout>
  );
}
