import { FolderOutlined } from '@ant-design/icons';
import { Menu, MenuProps } from 'antd';

type MenuItem = Required<MenuProps>['items'][number];

export default function () {
  const onClick: MenuProps['onClick'] = (e) => {
    console.log('click ', e);
  };

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
        getItem('Option 14', '14', <FolderOutlined />),
      ],
      'group'
    ),
  ];

  return (
    <Menu
      theme="dark"
      onClick={onClick}
      defaultSelectedKeys={['1']}
      defaultOpenKeys={['sub1']}
      mode="inline"
      items={items}
    />
  );
}
