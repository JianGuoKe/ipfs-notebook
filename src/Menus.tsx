import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SearchOutlined,
  EditOutlined,
  SmileOutlined,
} from '@ant-design/icons';
import { Button, ConfigProvider, List } from 'antd';
import dayjs from 'dayjs';
import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';
import { db } from './db';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);

const customizeRenderEmpty = () => (
  <div style={{ textAlign: 'center' }}>
    <SmileOutlined style={{ fontSize: 20 }} />
    <p>暂无记录</p>
  </div>
);

export default function ({
  bookVisible,
  onBookVisibleChange,
}: {
  bookVisible: boolean;
  onBookVisibleChange: (visible: boolean) => void;
}) {
  const bookMenus = useLiveQuery(async () => {
    const book = await db.books.filter((book) => book.isActived).first();
    return await db.menus.filter((menu) => menu.bookId === book?.id).toArray();
  }, []);

  return (
    <ConfigProvider renderEmpty={customizeRenderEmpty}>
      <div className="btns">
        <Button
          type="text"
          title="记事本列表"
          icon={bookVisible ? <MenuFoldOutlined /> : <MenuUnfoldOutlined />}
          onClick={(e) => onBookVisibleChange(!bookVisible)}
        ></Button>
        <Button
          type="text"
          className="right"
          title="搜索文本"
          icon={<SearchOutlined />}
        ></Button>
        <Button
          type="text"
          className="right"
          title="新增文本"
          icon={<EditOutlined />}
        ></Button>
      </div>
      <List
        itemLayout="horizontal"
        dataSource={bookMenus}
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
