import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SearchOutlined,
  EditOutlined,
} from '@ant-design/icons';
import { Button, List } from 'antd';
import { useState } from 'react';

const data = [
  {
    title: 'Ant Design Title 1',
  },
  {
    title: 'Ant Design Title 2',
  },
  {
    title: 'Ant Design Title 3',
  },
  {
    title: 'Ant Design Title 4',
  },
];

export default function ({
  bookVisible,
  onBookVisibleChange,
}: {
  bookVisible: boolean;
  onBookVisibleChange: (visible: boolean) => void;
}) {
  return (
    <>
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
        dataSource={data}
        renderItem={(item) => (
          <List.Item>
            <List.Item.Meta
              title={<a href="https://ant.design">{item.title}</a>}
              description="Ant Design, a design language for background applications, is refined by Ant UED Team"
            />
          </List.Item>
        )}
      />
    </>
  );
}
