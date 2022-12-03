import { DeleteOutlined, FolderOutlined, KeyOutlined } from '@ant-design/icons';
import { Button, Collapse, Input, InputRef, List, Select } from 'antd';
import { useRef, useState } from 'react';
const { Panel } = Collapse;
import './Settings.less';
const { TextArea } = Input;
const { Option } = Select;

const selectBefore = (
  <Select defaultValue="https://">
    <Option value="http://">http://</Option>
    <Option value="https://">https://</Option>
  </Select>
);

export default function Settings({ onPPKAdd, onFolderAdd }: any) {
  const inputRef = useRef<InputRef>(null);

  return (
    <Collapse className="ipfs-settings" ghost>
      <Panel header="我的记事本文件夹 (IPFS)" key="ipfsnode">
        <p>
          选择一个IPFS网络接入节点,数据会优先存储到当前节点,但是其他节点也能访问,不强依赖某个服务节点限制。
        </p>
        <Input
          ref={inputRef}
          addonBefore={selectBefore}
          defaultValue="jianguoke.cn/ipfs"
          onFocus={() =>
            inputRef.current!.focus({
              cursor: 'all',
            })
          }
        />
        <p>记事本目录</p>
        <List
          itemLayout="horizontal"
          dataSource={[1]}
          renderItem={(item) => (
            <List.Item>
              <List.Item.Meta
                avatar={<FolderOutlined style={{ fontSize: 26 }} />}
                title={
                  <span>
                    xxxxxxxxxxxxxxxxxxx{' '}
                    <DeleteOutlined title="删除文件夹HASH" />
                  </span>
                }
                description={
                  <span title="QmQATmpxXvSiQgt9c9idz9k3S3gQnh7wYj4DbdMQ9VGyLh">
                    QmQATmpxXvSiQgt9c9idz9k3S3gQnh7wYj4DbdMQ9VGyLh
                  </span>
                }
              />
            </List.Item>
          )}
        />
        <p>
          <Button
            onClick={() => {
              onFolderAdd();
            }}
          >
            添加新目录
          </Button>
        </p>
      </Panel>
      <Panel header="个人数据隐私保护" key="rsapk">
        <p>
          秘钥用于<strong>加密数据存储</strong>
          在去中心化的分布式存储网络((IPFS)中,防止数据被查看,保护个人隐私数据。
        </p>
        <List
          itemLayout="horizontal"
          dataSource={[1]}
          renderItem={(item) => (
            <List.Item>
              <List.Item.Meta
                avatar={<KeyOutlined style={{ fontSize: 26 }} />}
                title={'xxxxxxxxxxxxxxxxxxx'}
                description="xxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              />
            </List.Item>
          )}
        />
        <p>
          <Button
            onClick={() => {
              onPPKAdd();
            }}
          >
            添加新秘钥
          </Button>
        </p>
      </Panel>
    </Collapse>
  );
}
