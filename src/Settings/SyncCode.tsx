import { Button, Modal, Space, message } from 'antd';
import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';
import { db } from '../Data';
import { trackClick } from '../tracker';

export function SyncCode({
  onFolderAdd,
}: {
  onFolderAdd: (type: string) => void;
}) {
  const folders = useLiveQuery(() => db.books.toArray(), []);
  const [openCode, setOpenCode] = useState(0);
  const [messageApi, contextHolder] = message.useMessage();

  function stopSync() {
    setOpenCode(0);
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
        onCancel={() => setOpenCode(0)}
        okButtonProps={{ disabled: true }}
        className="ipfs-settings-synccode"
      >
        <p>
          输入 <strong style={{ color: 'green' }}>{openCode}</strong>{' '}
          同步此设备上的
          <strong>{folders?.length || 0}</strong>个记事本
        </p>
        <Space direction="vertical" className="p">
          <Button type="text" disabled>
            等待链接
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
          onClick={() => {
            trackClick('synccode', '同步码');
            const code = Math.floor(Math.random() * 1000000);
            setOpenCode(code);
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
