import { Button, Modal, Space, message } from 'antd';
import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';
import { db } from '../Data';
import { trackClick } from '../tracker';
import { connectWsChannel } from '../Channel';
import copy from 'copy-to-clipboard';

let dispose: () => void;

export function SyncCode({
  onFolderAdd,
}: {
  onFolderAdd: (type: string) => void;
}) {
  const folders = useLiveQuery(() => db.books.toArray(), []);
  const keys = useLiveQuery(() => db.keys.toArray(), []);
  const defaultKey = useLiveQuery(() => db.getActiveKey(), []);
  const [openCode, setOpenCode] = useState(0);
  const [messageApi, contextHolder] = message.useMessage();
  const options = useLiveQuery(() => db.getOptions(), []);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  function stopSync() {
    setOpenCode(0);
    setLoading(false);
    dispose && dispose();
  }

  function startSync() {
    const code = Math.floor(Math.random() * 1000000);
    setLoading(true);
    dispose = connectWsChannel(
      options!.clientId!,
      code.toString(),
      (ready, clients) => {
        setLoading(false);
        if (ready) {
          setOpenCode(code);
          setStatus(clients?.length! > 1 ? 'ready' : 'waitting');
        } else {
          setOpenCode(0);
          setStatus('');
          dispose && dispose();
          message.error('连接失败!稍后重试');
        }
      },
      (type, message, ws) => {
        if (type === 'getFolders') {
          setStatus('syncing');
          ws!.send(
            JSON.stringify({
              command: 'send',
              type: 'folders',
              message: folders?.map((book) => ({
                ...book,
                key:
                  keys?.find((it) => it.name === book.activeKey) || defaultKey,
              })),
            })
          );
        } else if (type === 'syncEnd') {
          setStatus('synced');
        }
      }
    );
  }

  return (
    <>
      <p>
        数据同步码会在多个设备间进行记事本和秘钥同步，
        必须保证多个设备同时输入相同的同步码同步。
      </p>
      <Modal
        title="数据同步"
        open={!!openCode}
        footer={null}
        closable={false}
        maskClosable={status === 'synced'}
        onCancel={() => setOpenCode(0)}
        okButtonProps={{ disabled: true }}
        className="ipfs-settings-synccode"
      >
        <p>
          输入{' '}
          <strong
            className="code"
            onClick={() => {
              trackClick('copy_code', '复制同步码');
              const ret = copy(openCode.toString());
              ret
                ? messageApi.success('已复制' + openCode)
                : messageApi.error('复制失败');
            }}
          >
            {openCode}
          </strong>{' '}
          同步此设备上的
          <strong>{folders?.length || 0}</strong>个记事本
        </p>
        <Space direction="vertical" className="p">
          <Button type="text" disabled>
            {status === 'synced'
              ? '同步完成'
              : status === 'syncing'
              ? '开始同步'
              : status === 'ready'
              ? '已经连接'
              : status === 'waitting'
              ? '等待连接'
              : '准备连接'}
          </Button>
          <Button
            type="text"
            danger
            onClick={() => {
              try {
                stopSync();
              } catch (err) {
                messageApi.error((err as any).message);
              }
            }}
          >
            取消
          </Button>
        </Space>
      </Modal>
      <Space>
        <Button
          loading={loading}
          onClick={() => {
            trackClick('synccode', '同步码');
            startSync();
          }}
        >
          同步码
        </Button>
        <Button
          type="text"
          onClick={() => {
            trackClick('syncother', '同步其他设备');
            onFolderAdd('add_only');
          }}
        >
          同步其他设备
        </Button>
      </Space>
      {contextHolder}
    </>
  );
}
