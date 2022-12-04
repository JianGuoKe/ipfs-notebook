import { FolderOutlined, PlusOutlined } from '@ant-design/icons';
import { Menu, MenuProps } from 'antd';
import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo } from 'react';
import { db } from './db';
import './Books.less';

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

export default function ({
  addVisible,
  onCreateFolder,
}: {
  addVisible: boolean;
  onCreateFolder: (mode: string) => void;
}) {
  const books = useLiveQuery(() => db.books.toArray(), []);

  const onClick: MenuProps['onClick'] = (e) => {};

  const items: MenuProps['items'] = useMemo(() => {
    const groups = books?.reduce((servers, it) => {
      if (!servers.includes(it.url)) {
        try {
          servers.push(new URL(it.url).hostname);
        } catch (err) {
          console.error(err);
        }
      }
      return servers;
    }, [] as string[]);
    let menu = groups?.map((g) => {
      return getItem(
        'Group',
        g,
        null,
        books
          ?.filter((it) => it.url.includes(g))
          .map((it) => getItem(it.title || g, g, <FolderOutlined />)),
        'group'
      );
    });
    if (!menu || menu?.length <= 0) {
      menu = [
        getItem(
          <span>
            无记事本
            {!addVisible && (
              <PlusOutlined
                onClick={() => onCreateFolder('create')}
              ></PlusOutlined>
            )}
          </span>,
          '',
          null,
          [],
          'group'
        ),
      ];
    }
    return menu;
  }, [books, addVisible]);

  return (
    <>
      <Menu
        theme="dark"
        onClick={onClick}
        className="ipfs-books"
        defaultSelectedKeys={['1']}
        defaultOpenKeys={['sub1']}
        mode="inline"
        items={items}
      />
    </>
  );
}
