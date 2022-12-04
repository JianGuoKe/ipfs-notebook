import {
  CopyOutlined,
  DeleteOutlined,
  FolderOutlined,
  KeyOutlined,
} from '@ant-design/icons';
import {
  Button,
  Collapse,
  ConfigProvider,
  Input,
  InputRef,
  List,
  message,
  Popconfirm,
  Select,
} from 'antd';
import copy from 'copy-to-clipboard';
import { useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './Data';
import ScrollView from 'react-custom-scrollbars';
const { Panel } = Collapse;
import './Settings.less';
import dayjs from 'dayjs';
const { Option } = Select;

const selectBefore = (defaultValue?: string) => (
  <Select defaultValue={defaultValue || 'https://'}>
    <Option value="http://">http://</Option>
    <Option value="https://">https://</Option>
  </Select>
);

const customizeRenderEmpty = () => '未添加设置';

export default function Settings({ onPPKAdd, onFolderAdd }: any) {
  const inputRef = useRef<InputRef>(null);
  const node = useLiveQuery(() => db.nodes.toCollection().first(), []);
  const folders = useLiveQuery(() => db.books.toArray(), []);
  const keys = useLiveQuery(() => db.keys.toArray(), []);

  return (
    <ConfigProvider renderEmpty={customizeRenderEmpty}>
      <div className="ipfs-settings">
        <ScrollView autoHide>
          <Collapse ghost>
            <Panel header="我的记事本文件夹 (IPFS)" key="ipfsnode">
              <p>
                选择一个IPFS网络接入节点,数据会优先存储到当前节点,但是其他节点也能访问,不强依赖某个服务节点限制。
              </p>
              <Input
                ref={inputRef}
                addonBefore={selectBefore(node?.url.split('://')[0])}
                defaultValue={node?.url.split('://')[1]}
                onFocus={() =>
                  inputRef.current!.focus({
                    cursor: 'all',
                  })
                }
              />
              <p>记事本目录</p>
              <List
                itemLayout="horizontal"
                dataSource={folders}
                renderItem={(item) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={<FolderOutlined style={{ fontSize: 26 }} />}
                      title={
                        <span>
                          {item.title || '同步中...'}
                          <Popconfirm
                            title="删除后将移除记事本?"
                            onConfirm={() => db.deleteBook(item.id!)}
                            okText="确定删除"
                            cancelText="取消"
                          >
                            <DeleteOutlined title="删除文件夹HASH" />
                          </Popconfirm>
                        </span>
                      }
                      description={
                        <span title={item.hash}>
                          {item.hash || '文件Hash创建中...'}
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
                dataSource={keys}
                renderItem={(item) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={<KeyOutlined style={{ fontSize: 26 }} />}
                      title={
                        <span>
                          {item.name}{' '}
                          <CopyOutlined
                            title="复制秘钥"
                            onClick={() => {
                              const ret = copy(
                                (item.pubKey.includes('BEGIN PUBLIC KEY')
                                  ? ''
                                  : '-----BEGIN PUBLIC KEY-----\n') +
                                  item.pubKey +
                                  (item.priKey.includes('END PUBLIC KEY')
                                    ? ''
                                    : '-----END PUBLIC KEY-----') +
                                  '\n\n' +
                                  (item.priKey.includes('BEGIN RSA PRIVATE KEY')
                                    ? ''
                                    : '-----BEGIN RSA PRIVATE KEY-----\n') +
                                  item.priKey +
                                  (item.priKey.includes('END RSA PRIVATE KEY')
                                    ? ''
                                    : '-----END RSA PRIVATE KEY-----')
                              );
                              ret
                                ? message.success('复制完成')
                                : message.error('复制失败');
                            }}
                          ></CopyOutlined>
                          <Popconfirm
                            title="删除此秘钥?"
                            onConfirm={() => db.deleteKey(item.id!)}
                            okText="确定"
                            cancelText="取消"
                          >
                            <DeleteOutlined title="删除" />
                          </Popconfirm>
                        </span>
                      }
                      description={
                        <>
                          <div>
                            {dayjs(item.createAt).locale('zh-cn').fromNow()}
                          </div>
                          <div>{item.pubKey}</div>
                        </>
                      }
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
        </ScrollView>
      </div>
    </ConfigProvider>
  );
}
