import { Button, InputRef, Modal, Input } from 'antd';
import { useRef } from 'react';

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
  function addNewKey() {
    // TODO
    onClose();
  }
  const footer = [
    <Button key="back" onClick={onClose}>
      取消
    </Button>,
    <Button key="new" type={mode === 'create' ? 'primary' : 'default'}>
      创建新文件夹
    </Button>,
  ];
  if (mode === 'add') {
    footer.push(
      <Button key="submit" type="primary" onClick={addNewKey}>
        确定添加
      </Button>
    );
  }
  return (
    <Modal
      open={open}
      title="添加记事本"
      onOk={addNewKey}
      onCancel={onClose}
      footer={footer}
    >
      <p>添加一个去中心化网络(IPFS)上的文件夹作为当前记事本</p>
      {mode === 'add' && (
        <Input
          ref={inputPriRef}
          placeholder="文件夹Hash"
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
