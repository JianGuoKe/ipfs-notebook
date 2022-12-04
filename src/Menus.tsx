import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SearchOutlined,
  EditOutlined,
  SmileOutlined,
} from '@ant-design/icons';
import { Button, ConfigProvider, List, Input } from 'antd';
import dayjs from 'dayjs';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './Data';
import './Menus.less';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useState } from 'react';
import VirtualList from 'rc-virtual-list';
dayjs.extend(relativeTime);

const customizeRenderEmpty = () => (
  <div style={{ textAlign: 'center' }}>
    <SmileOutlined style={{ fontSize: 20 }} />
    <p>暂无日志</p>
  </div>
);

export default function ({
  bookVisible,
  onBookVisibleChange,
  onCreateBook,
}: {
  bookVisible: boolean;
  onCreateBook: (mode: string) => void;
  onBookVisibleChange: (visible: boolean) => void;
}) {
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [limit, setLimit] = useState(20);
  const activeBook = useLiveQuery(() => db.getActiveBook(), []);
  const bookMenus = useLiveQuery(async () => {
    return (
      await db.notes
        .filter(
          (note) =>
            note.hash === activeBook?.hash &&
            (searchText ? note.content.includes(searchText) || false : true)
        )
        .limit(limit)
        .toArray()
    ).map((it) => {
      const ct = it.content.split('\n');
      return {
        title: ct[0],
        lastAt: it.updateAt || it.createAt || it.deleteAt,
        summary: ct[1].trim(),
      };
    });
  }, []);

  function addNewNote() {
    if (!activeBook) {
      return onCreateBook('add');
    }
  }

  function onScroll() {
    setLimit(limit + 20);
  }

  return (
    <ConfigProvider renderEmpty={customizeRenderEmpty}>
      <List
        className="ipfs-menus"
        header={
          <>
            <div className="btns">
              <Button
                type="text"
                title="记事本列表"
                icon={
                  bookVisible ? <MenuFoldOutlined /> : <MenuUnfoldOutlined />
                }
                onClick={(e) => onBookVisibleChange(!bookVisible)}
              ></Button>
              <Button
                type="text"
                className="right"
                title="搜索文本"
                icon={<SearchOutlined />}
                onClick={() => setSearchVisible(!searchVisible)}
              ></Button>
              <Button
                type="text"
                className="right"
                title="新增文本"
                icon={<EditOutlined />}
                onClick={() => addNewNote()}
              ></Button>
            </div>
            {searchVisible && (
              <Input.Search
                size="small"
                placeholder="输入查找内容..."
                onSearch={(v) => setSearchText(v)}
              />
            )}
          </>
        }
      >
        {bookMenus && bookMenus.length > 0 && (
          <VirtualList
            data={bookMenus}
            height={47}
            itemHeight={47}
            itemKey="email"
            onScroll={onScroll}
          >
            {(item) => (
              <List.Item>
                <List.Item.Meta
                  title={<a>{item.title}</a>}
                  description={
                    <>
                      <span>{dayjs(item.lastAt).fromNow()}</span>
                      <span>{item.summary}</span>
                    </>
                  }
                />
              </List.Item>
            )}
          </VirtualList>
        )}
      </List>
    </ConfigProvider>
  );
}
