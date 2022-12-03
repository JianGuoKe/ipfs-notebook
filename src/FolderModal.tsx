import { Button, InputRef, Modal, Input } from 'antd';
import { useRef } from 'react';

export default function ({ open, onClose }: any) {
  const inputPKRef = useRef<InputRef>(null);
  const inputPriRef = useRef<InputRef>(null);
  function addNewKey() {
    // TODO
    onClose();
  }
  return (
    <Modal
      open={open}
      title="添加记事本"
      onOk={addNewKey}
      onCancel={onClose}
      footer={[
        <Button key="new">创建新文件夹</Button>,
        <Button key="back" onClick={onClose}>
          取消
        </Button>,
        <Button key="submit" type="primary" onClick={addNewKey}>
          确定添加
        </Button>,
      ]}
    >
      <p>添加一个去中心化网络(IPFS)上的文件夹作为当前记事本</p>
      <Input
        ref={inputPriRef}
        placeholder="文件夹Hash"
        onFocus={() =>
          inputPriRef.current!.focus({
            cursor: 'all',
          })
        }
      />
    </Modal>
  );
}
