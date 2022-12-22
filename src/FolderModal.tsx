import { Button, InputRef, Modal, Input, message } from 'antd';
import { useEffect, useRef, useState } from 'react';
import { db } from './Data';

export default function ({
  open,
  mode,
  onClose,
}: {
  mode: string; //  'add' | 'create'
  open: boolean;
  onClose: () => void;
}) {
  const inputPriRef = useRef<InputRef>(null);
  const [newMode, setMode] = useState(mode);
  const [hash, setHash] = useState('');

  useEffect(() => {
    setMode(mode);
  }, [mode]);

  async function addNewHash() {
    try {
      await db.createEmptyBook('');
      onClose();
    } catch (err) {
      message.error((err as Error).message);
    }
  }

  async function addHash() {
    try {
      await db.addBook(hash);
      onClose();
    } catch (err) {
      message.error((err as Error).message);
    }
  }

  const footer = [];
  if (newMode === 'add') {
    footer.push(
      <Button key="new" onClick={addNewHash}>
        创建新文件夹
      </Button>,
      <Button key="back" onClick={onClose}>
        取消
      </Button>,
      <Button key="submit" type="primary" onClick={addHash}>
        确定添加
      </Button>
    );
  }
  if (newMode === 'create') {
    footer.push(
      <Button key="submit" onClick={() => setMode('add')}>
        添加文件夹
      </Button>,
      <Button key="back" onClick={onClose}>
        取消
      </Button>,
      <Button key="new" type={'primary'} onClick={addNewHash}>
        创建新文件夹
      </Button>
    );
  }
  return (
    <Modal
      open={open}
      title="添加记事本"
      onOk={addNewHash}
      onCancel={onClose}
      footer={footer}
    >
      <p>添加一个去中心化网络(IPFS)上的文件夹作为当前记事本</p>
      {newMode === 'add' && (
        <Input
          ref={inputPriRef}
          placeholder="文件夹名称"
          value={hash}
          onChange={(e) => setHash(e.target.value)}
          onFocus={() =>
            inputPriRef.current!.focus({
              cursor: 'all',
            })
          }
        />
      )}
    </Modal>
  );
}
