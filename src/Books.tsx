import { FolderOutlined, PlusOutlined } from '@ant-design/icons';
import { Menu, MenuProps } from 'antd';
import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo } from 'react';
import { db } from './Data';
import './Books.less';

type MenuItem = Required<MenuProps>['items'][number];

function getItem(
  label: React.ReactNode,
  key: React.Key,
  icon?: React.ReactNode,
  children?: MenuItem[],
  type?: 'group'
): any {
  return {
    key,
    icon,
    title: label,
    children,
    label,
    type: type,
  };
}

export default function ({
  addVisible,
  onCreateBook,
}: {
  addVisible: boolean;
  onCreateBook: (mode: string) => void;
}) {
  const books = useLiveQuery(() => db.books.toArray());
  const activeBook = useLiveQuery(() => db.getActiveBook());

  const onClick: MenuProps['onClick'] = (e) => {};

  const items: MenuProps['items'] = useMemo(() => {
    const groups = books?.reduce((servers, it) => {
      if (servers.every((hostName) => !it.url.includes(hostName))) {
        try {
          servers.push(new URL(it.url).hostname);
        } catch (err) {
          console.error(err);
        }
      }
      return servers;
    }, [] as string[]);
    let bookList = groups?.map((g) => {
      return getItem(
        g.split('.').slice(-2, 1).join('').toUpperCase(),
        g,
        null,
        books
          ?.filter((it) => it.url?.includes(g))
          .map((it) =>
            getItem(
              (it.title || '记事本') + (it.syncAt ? '' : '(同步中...)'),
              it.id!,
              <FolderOutlined />
            )
          ),
        'group'
      );
    });
    if (!bookList || bookList?.length <= 0) {
      bookList = [
        getItem(
          <span>
            无记事本
            {!addVisible && (
              <PlusOutlined
                onClick={() => onCreateBook('create')}
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
    return bookList;
  }, [books, addVisible]);

  return (
    <>
      <Menu
        theme="dark"
        onClick={onClick}
        className="ipfs-books"
        selectedKeys={activeBook?.id ? [activeBook?.id?.toString()] : []}
        onSelect={(e) => db.changeBook(parseInt(e.key))}
        mode="inline"
        items={items}
      />
    </>
  );
}
