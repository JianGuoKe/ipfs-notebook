import {
  CopyOutlined,
  DeleteOutlined,
  DownloadOutlined,
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
  Modal,
  Popconfirm,
  Select,
} from 'antd';
import copy from 'copy-to-clipboard';
import React, { useEffect, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Book, db } from './Data';
import { Scrollbars } from 'react-custom-scrollbars-2';
const { Panel } = Collapse;
import './Settings.less';
import dayjs from 'dayjs';
import { createPem, download, getReasonText, openDev } from './utils';
import { trackClick } from './tracker';
import { getFolderList, upsertFolderList, useLogin } from './Client';
const { Option } = Select;

const selectBefore = (defaultValue?: string, onChange?: any) => (
  <Select value={defaultValue || 'https'} onChange={onChange}>
    <Option value="http">http://</Option>
    <Option value="https">https://</Option>
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
  const [nodeUrl, setNodeEdit] = useState(node?.url);
  const user = useLogin();
  const [openCode, setOpenCode] = useState(0);
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    setNodeEdit(node?.url);
  }, [node]);

  async function checkNodeEditEnd(e: React.KeyboardEvent) {
    if (e.key !== 'Enter') {
      return;
    }
    node!.url = nodeUrl!;
    await db.updateNodeUrl(node!);
  }

  function handChangeBefore(v: string) {
    const urls = nodeUrl?.split('://') || [];
    urls[0] = v;
    setNodeEdit(urls?.join('://'));
  }

  function handleHostName(v: string) {
    const urls = nodeUrl?.split('://') || [];
    urls[1] = v;
    setNodeEdit(urls?.join('://'));
  }

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

  const [syncFolders, setSyncFolders] = useState<any[]>();
  const [v, setV] = useState<string>();
  const [error, setError] = useState<Error | null>();

  async function fetchBookList() {
    const [remotes, _v] = await getFolderList();
    remotes.forEach((book: any) => {
      // 和本地hash不一致都是需要同步的
      book.isSyncing = folders?.every((it) => it.hash !== book.hash);
    });
    setV(_v);
    // 追加上本地的
    const newFolders = remotes?.concat(
      folders
        ?.filter((local) =>
          remotes?.every((remote: any) => remote.hash !== local.hash)
        )
        .map((it) => {
          return { ...it, isSyncing: true };
        })
    );
    setSyncFolders(newFolders);
  }

  async function syncBookList() {
    const options = await db.getOptions();
    trackClick('sync_user', '同步数据', options?.clientId);
    for (const folder of syncFolders!) {
      if (folders?.every((it) => it.hash !== folder.hash)) {
        // 本地没有的需要增加
        await db.addBook(folder.name, folder.root, folder.hash);
      }
    }
    await upsertFolderList(
      syncFolders!
        .filter((it) => it.root)
        .map(({ root, name, title, hash }) => ({
          root,
          name,
          title,
          hash,
          clientId: options?.clientId,
        })),
      v!
    );
  }

  const syncCount =
    syncFolders?.filter((it) => it.isSyncing && it.root).length || 0;

  function synccode() {}

  return (
    <ConfigProvider renderEmpty={customizeRenderEmpty}>
      <div className="ipfs-settings">
        <Scrollbars autoHide>
          <Collapse ghost>
            <Panel header="记事本管理" key="ipfsnode">
              <p>
                选择一个IPFS网络接入节点,数据会优先存储到当前节点,但是其他节点也能访问,不强依赖某个服务节点限制。
              </p>
              <Input
                ref={inputRef}
                addonBefore={selectBefore(
                  nodeUrl?.split('://')[0],
                  handChangeBefore
                )}
                value={nodeUrl?.split('://')[1]}
                onBlur={(e) => {
                  setNodeEdit(node?.url);
                }}
                onKeyDown={(e) => checkNodeEditEnd(e)}
                onChange={(e) => {
                  handleHostName(e.target.value);
                }}
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
                              onClick={() => {
                                trackClick(
                                  'modify_folder',
                                  '修改记事本名称',
                                  item
                                );
                                startEditTitle(item);
                              }}
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
                              trackClick('copy_folder', '复制文件夹', item);
                              const ret = copy(item.name);
                              ret
                                ? messageApi.success('复制完成' + item.name)
                                : messageApi.error('复制失败');
                            }}
                          ></CopyOutlined>
                          {item.hash && (
                            <ScissorOutlined
                              title="迁移文件夹"
                              onClick={() => {
                                trackClick(
                                  'migrate_folder',
                                  '迁移文件夹',
                                  item
                                );
                                const ret = copy(item.hash!);
                                ret
                                  ? messageApi.success('复制完成' + item.hash!)
                                  : messageApi.error('复制失败');
                              }}
                            ></ScissorOutlined>
                          )}
                          <Popconfirm
                            title="删除后将移除记事本?"
                            onConfirm={() => {
                              trackClick(
                                'delete_folder',
                                '删除后将移除记事本',
                                item
                              );
                              db.deleteBook(item.id!);
                            }}
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
                            onClick={() => {
                              trackClick(
                                'resync_folder_setting',
                                '重新同步文件夹',
                                item
                              );
                              db.resyncBook(item);
                            }}
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
                    trackClick('new_folder', '添加新目录');
                    onFolderAdd();
                  }}
                >
                  添加新目录
                </Button>
              </p>
            </Panel>
            <Panel header="数据安全" key="rsapk">
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
                              trackClick('copy_key', '复制秘钥');
                              const ret = copy(
                                createPem(item.pubKey, item.priKey)
                              );
                              ret
                                ? messageApi.success('复制完成')
                                : messageApi.error('复制失败');
                            }}
                          ></CopyOutlined>
                          <DownloadOutlined
                            title="下载秘钥"
                            onClick={() => {
                              trackClick('download_key', '下载秘钥');
                              download(
                                `key-notebook-${new Date().getTime()}.pem`,
                                createPem(item.pubKey, item.priKey)
                              );
                            }}
                          ></DownloadOutlined>
                          <Popconfirm
                            title="删除此秘钥?"
                            onConfirm={() => {
                              trackClick('delete_key', '删除此秘钥');
                              db.deleteKey(item.id!);
                            }}
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
                    trackClick('new_key', '添加新秘钥');
                    onPPKAdd();
                  }}
                >
                  添加新秘钥
                </Button>
              </p>
            </Panel>
            {/*  <Panel header="账户同步" key="acc">
              <p>
                登录相同的账户,自动同步相同账户间的记事本文件夹和秘钥设置,快速数据共享。
              </p>
              {user && (
                <p>
                  已经登录: {user.name}
                  <Button
                    type="text"
                    onClick={() => {
                      trackClick('logout', '退出登录');
                      logout();
                    }}
                  >
                    退出
                  </Button>
                </p>
              )}
              <div>
                {user ? (
                  <Space>
                    <Popconfirm
                      title="同步数据"
                      description={
                        syncFolders ? (
                          <>
                            <span
                              title={syncFolders
                                .filter((it) => it.isSyncing && it.root)
                                .map((it) => it.name)
                                .join(',')}
                            >
                              {syncCount > 0
                                ? `可以同步${
                                    syncFolders.filter(
                                      (it) => it.isSyncing && it.root
                                    ).length
                                  }个记事本?`
                                : '无需同步'}
                            </span>
                            {syncFolders.filter(
                              (it) => it.isSyncing && !it.root
                            ).length ? (
                              <span
                                title={syncFolders
                                  .filter((it) => it.isSyncing && !it.root)
                                  .map((it) => it.name)
                                  .join(',')}
                              >
                                (
                                {`${
                                  syncFolders.filter(
                                    (it) => it.isSyncing && !it.root
                                  ).length
                                }个未在IPFS网络保存无法账户间同步`}
                                )
                              </span>
                            ) : null}
                          </>
                        ) : error ? (
                          '获取数据失败:' + error.message
                        ) : (
                          '请稍后正在获取同步列表'
                        )
                      }
                      okButtonProps={{
                        disabled: syncCount === 0,
                      }}
                      onConfirm={() => {
                        syncBookList()
                          .then(() => {
                            messageApi.success('完成');
                          })
                          .catch((err) => messageApi.error(err.message));
                      }}
                      okText="确定"
                      cancelText="取消"
                      onOpenChange={(open) => {
                        setError(null);
                        open && trackClick('fetch_folders', '获取同步数据');
                        open &&
                          fetchBookList().catch((err) => {
                            setError(err);
                          });
                      }}
                    >
                      <Button danger>同步数据</Button>
                    </Popconfirm>
                  </Space>
                ) : ( 
                     <Button
                    onClick={() => {
                      trackClick('login', '登录账户');
                      try {
                        login();
                      } catch (err) {
                        messageApi.error((err as any).message);
                      }
                    }}
                  >
                    登录账户
                  </Button>   
                )}
              </div>  
            </Panel>*/}
            <Panel header="数据同步" key="synccode">
              <p>
                数据同步码会在多个设备间进行记事本和秘钥同步，
                必须保证多个设备同时输入相同的同步码同步。
              </p>
              <Modal
                title="数据同步"
                open={!!openCode}
                footer={
                  <>
                    <Button
                      type="text"
                      disabled
                      onClick={() => {
                        try {
                          synccode();
                        } catch (err) {
                          messageApi.error((err as any).message);
                        }
                      }}
                    >
                      准备同步
                    </Button>
                  </>
                }
                onCancel={() => setOpenCode(0)}
                okButtonProps={{ disabled: true }}
              >
                <p>
                  输入 <strong style={{ color: 'green' }}>{openCode}</strong>{' '}
                  同步此设备上的
                  <strong>{folders?.length || 0}</strong>个记事本
                </p>
              </Modal>
              <Button
                onClick={() => {
                  trackClick('synccode', '同步连接');
                  const code = Math.floor(Math.random() * 1000000);
                  setOpenCode(code);
                }}
              >
                同步连接
              </Button>
            </Panel>
            <Panel header="开发者社区" key="dev">
              <p>
                进入开发者社区一起讨论功能问题和改进建议,
                这里你还能看到开发者的改进计划和未来新特性。
              </p>
              <Button type="primary" onClick={() => openDev()}>
                打开社区
              </Button>
            </Panel>
          </Collapse>
        </Scrollbars>
        {contextHolder}
      </div>
    </ConfigProvider>
  );
}
