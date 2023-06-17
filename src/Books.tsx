import {
  FolderOutlined,
  PlusOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { Button, Menu, MenuProps } from 'antd';
import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo } from 'react';
import { Book, db } from './Data';
import './Books.less';
import { getReasonText } from './utils';
import { trackClick } from './tracker';

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
  onSetting,
  onBookSelected,
}: {
  addVisible: boolean;
  onCreateBook: (mode: string) => void;
  onSetting: () => void;
  onBookSelected?: (bookName: string) => void;
}) {
  const books = useLiveQuery(() =>
    db.books.filter((book) => book.enabled).toArray()
  );
  const activeBook = useLiveQuery(() => db.getActiveBook());

  const handleMenuClick: MenuProps['onClick'] = (e) => {
    trackClick('select_book', '选中记事本', e.key);
    if (onBookSelected) {
      onBookSelected(e.key);
    }
  };

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
        <span
          onClick={() => {
            trackClick('click_bookgroup', '点击分组', g);
          }}
        >
          {g.split('.').slice(-2)[0].toUpperCase()}
          <Button
            type="text"
            className="ipfs-books-add"
            icon={<PlusOutlined />}
            onClick={() => {
              trackClick('create_book', '添加记事本');
              onCreateBook('create');
            }}
          ></Button>
        </span>,
        g,
        null,
        books
          ?.filter((it) => it.url?.includes(g))
          .map((it) =>
            getItem(
              <>
                {it.title || '记事本'}
                <span
                  title={getReasonText(it.reason)}
                  onClick={() => {
                    trackClick('resync_book', '同步记事本', it);
                    db.resyncBook(it);
                  }}
                >
                  {it.syncAt
                    ? ''
                    : it.reason !== 'success' && it.reason
                    ? '(同步失败...)'
                    : '(同步中...)'}
                </span>
              </>,
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
                onClick={() => {
                  trackClick('create_book_empty', '添加记事本');
                  onCreateBook('create');
                }}
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
        onClick={handleMenuClick}
        className="ipfs-books"
        selectedKeys={activeBook?.id ? [activeBook?.id?.toString()] : []}
        onSelect={(e) => db.changeBook(parseInt(e.key))}
        mode="inline"
        items={items}
      />
      <Button
        className="ipfs-notebook-settings"
        type="text"
        title="记事本设置"
        icon={<SettingOutlined />}
        onClick={() => {
          trackClick('setting_book', '设置记事本');
          onSetting();
        }}
      ></Button>
    </>
  );
}
