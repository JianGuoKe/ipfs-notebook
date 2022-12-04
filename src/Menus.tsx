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
import { db } from './db';
import './Menus.less';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useState } from 'react';
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
  const bookMenus = useLiveQuery(async () => {
    return await db.menus
      .filter(
        (menu) =>
          menu.bookId === db.activeBook?.id &&
          (searchText ? menu.summary?.includes(searchText) || false : true)
      )
      .toArray();
  }, []);

  function addNewNote() {
    if (!db.activeBook) {
      return onCreateBook('add');
    }
  }

  return (
    <ConfigProvider renderEmpty={customizeRenderEmpty}>
      <List
        className="ipfs-menus"
        itemLayout="horizontal"
        dataSource={bookMenus}
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
        renderItem={(item) => (
          <List.Item>
            <List.Item.Meta
              title={<a href="https://ant.design">{item.title}</a>}
              description={
                <>
                  <span>{dayjs(item.updateAt || item.createAt).fromNow()}</span>
                  <span>{item.summary}</span>
                </>
              }
            />
          </List.Item>
        )}
      />
    </ConfigProvider>
  );
}
