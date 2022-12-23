import {
  CopyOutlined,
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  FolderOutlined,
  KeyOutlined,
  ScissorOutlined,
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
import React, { useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Book, db } from './Data';
import { Scrollbars } from 'react-custom-scrollbars-2';
const { Panel } = Collapse;
import './Settings.less';
import dayjs from 'dayjs';
import { createPem, download, getReasonText } from './utils';
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
  const [title, setTitle] = useState('');
  const [editBook, setBookEdit] = useState<Book>();

  function startEditTitle(item: Book) {
    if (!editBook) {
      setTitle(item.title || '记事本');
    }
    setBookEdit(item);
  }

  async function checkEditEnd(e: React.KeyboardEvent) {
    if (e.key !== 'Enter') {
      return;
    }
    editBook!.title = title;
    await db.updateBookTitle(editBook!);
    setBookEdit(undefined);
  }

  return (
    <ConfigProvider renderEmpty={customizeRenderEmpty}>
      <div className="ipfs-settings">
        <Scrollbars autoHide>
          <Collapse ghost>
            <Panel header="私有数据存储 (IPFS)" key="ipfsnode">
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
                          {editBook !== item ? (
                            <span
                              title="修改记事本名称"
                              onClick={() => startEditTitle(item)}
                            >
                              {item.title || '记事本'}
                              {!item.enabled ? '(删除中...)' : ''}
                            </span>
                          ) : null}
                          {editBook === item ? (
                            <Input
                              value={title}
                              style={{ width: 80 }}
                              size="small"
                              autoFocus
                              onBlur={(e) => setBookEdit(undefined)}
                              onKeyDown={(e) => checkEditEnd(e)}
                              onChange={(e) => setTitle(e.target.value)}
                            ></Input>
                          ) : null}
                          <CopyOutlined
                            title="复制文件夹"
                            onClick={() => {
                              const ret = copy(item.name);
                              ret
                                ? message.success('复制完成' + item.name)
                                : message.error('复制失败');
                            }}
                          ></CopyOutlined>
                          {item.hash && (
                            <ScissorOutlined
                              title="迁移文件夹"
                              onClick={() => {
                                const ret = copy(item.hash!);
                                ret
                                  ? message.success('复制完成' + item.hash!)
                                  : message.error('复制失败');
                              }}
                            ></ScissorOutlined>
                          )}
                          <Popconfirm
                            title="删除后将移除记事本?"
                            onConfirm={() => db.deleteBook(item.id!)}
                            okText="删除"
                            cancelText="取消"
                          >
                            <DeleteOutlined title="删除文件夹" />
                          </Popconfirm>
                        </span>
                      }
                      description={
                        <span title={item.hash}>
                          {item.name}{' '}
                          <span
                            title={getReasonText(item.reason)}
                            onClick={() => db.resyncBook(item)}
                          >
                            {item.syncAt ? dayjs(item.syncAt).fromNow() : ''}
                            {item.reason && item.reason !== 'success'
                              ? '(同步失败...)'
                              : item.syncAt
                              ? ''
                              : '(同步中...)'}
                          </span>
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
            <Panel header="数据隐私保护(秘钥)" key="rsapk">
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
                          {'秘钥'}{' '}
                          <CopyOutlined
                            title="复制秘钥"
                            onClick={() => {
                              const ret = copy(
                                createPem(item.pubKey, item.priKey)
                              );
                              ret
                                ? message.success('复制完成')
                                : message.error('复制失败');
                            }}
                          ></CopyOutlined>
                          <DownloadOutlined
                            title="下载秘钥"
                            onClick={() => {
                              download(
                                `key-notebook-${new Date().getTime()}.pem`,
                                createPem(item.pubKey, item.priKey)
                              );
                            }}
                          ></DownloadOutlined>
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
        </Scrollbars>
      </div>
    </ConfigProvider>
  );
}
