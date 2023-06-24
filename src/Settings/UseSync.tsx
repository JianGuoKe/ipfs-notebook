import { Button, Space, Popconfirm, message } from 'antd';
import {
  logout,
  login,
  getFolderList,
  upsertFolderList,
  useLogin,
} from '../Client';
import { trackClick } from '../tracker';
import { useState } from 'react';
import { db } from '../Data';
import { useLiveQuery } from 'dexie-react-hooks';

export function UserSync() {
  const folders = useLiveQuery(() => db.books.toArray(), []);
  const [syncFolders, setSyncFolders] = useState<any[]>();
  const [v, setV] = useState<string>();
  const [error, setError] = useState<Error | null>();
  const user = useLogin();
  const [messageApi, contextHolder] = message.useMessage();

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

  return (
    <>
      {contextHolder}
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
                            syncFolders.filter((it) => it.isSyncing && it.root)
                              .length
                          }个记事本?`
                        : '无需同步'}
                    </span>
                    {syncFolders.filter((it) => it.isSyncing && !it.root)
                      .length ? (
                      <span
                        title={syncFolders
                          .filter((it) => it.isSyncing && !it.root)
                          .map((it) => it.name)
                          .join(',')}
                      >
                        (
                        {`${
                          syncFolders.filter((it) => it.isSyncing && !it.root)
                            .length
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
      </div>{' '}
    </>
  );
}
