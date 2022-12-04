import { Button, InputRef, Modal, Input } from 'antd';
import { useRef, useState } from 'react';
import { db } from './Data';

export default function ({ open, onClose }: any) {
  const inputPKRef = useRef<InputRef>(null);
  const inputPriRef = useRef<InputRef>(null);
  const [priKey, setPriKey] = useState('');
  const [pubKey, setPubKey] = useState('');

  async function addNewKey() {
    await db.addKey(priKey, pubKey);
    setPriKey('');
    setPubKey('');
    onClose();
  }
  return (
    <Modal
      open={open}
      title="添加秘钥"
      width={620}
      onOk={addNewKey}
      onCancel={onClose}
      footer={[
        <Button key="back" onClick={onClose}>
          取消
        </Button>,
        <Button key="submit" type="primary" onClick={addNewKey}>
          确定添加
        </Button>,
      ]}
    >
      <p>
        公钥设置,公钥用于加密数据存储,如果不设置公钥,数据将以明文存储
        <strong>不建议</strong>。 点击
        <a href="http://tools.jb51.net/password/rsa_encode" target={'_blank'}>
          生成秘钥
        </a>
      </p>
      <Input.TextArea
        ref={inputPKRef}
        rows={6}
        placeholder="-----BEGIN PUBLIC KEY-----"
        value={pubKey}
        onChange={(e) => setPubKey(e.target.value)}
        onFocus={() =>
          inputPKRef.current!.focus({
            cursor: 'all',
          })
        }
      />
      <p>
        私钥设置,私钥紧紧<strong>存储当前浏览器</strong>
        中,用于获取数据解密,如果更换设备或者同时访问需要拷贝复制过去。
      </p>
      <Input.TextArea
        ref={inputPriRef}
        rows={6}
        placeholder="-----BEGIN RSA PRIVATE KEY-----"
        value={priKey}
        onChange={(e) => setPriKey(e.target.value)}
        onFocus={() =>
          inputPriRef.current!.focus({
            cursor: 'all',
          })
        }
      />
    </Modal>
  );
}
