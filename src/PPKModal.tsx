import { Button, InputRef, Modal, Input, message, Upload } from 'antd';
import { useRef, useState } from 'react';
import { db } from './Data';
import keypair from 'keypair';
import { createPem, download, loadPem } from './utils';
import { trackClick } from './tracker';

export default function ({ open, onClose }: any) {
  const inputPKRef = useRef<InputRef>(null);
  const inputPriRef = useRef<InputRef>(null);
  const [priKey, setPriKey] = useState('');
  const [pubKey, setPubKey] = useState('');

  async function addNewKey() {
    try {
      await db.addKey(priKey, pubKey);
      setPriKey('');
      setPubKey('');
      onClose();
    } catch (err: any) {
      message.warning(err.message);
    }
  }

  function genKeys() {
    const keys = keypair({
      bits: 2048,
    });
    setPriKey(keys.private);
    setPubKey(keys.public);
  }

  function startDownPPK() {
    if (!pubKey || !priKey) {
      return message.warning('key不完整,需要把私钥和公钥都创建');
    }
    download(
      `key-notebook-${new Date().getTime()}.pem`,
      createPem(pubKey, priKey)
    );
  }

  function closeModal() {
    setPriKey('');
    setPubKey('');
    onClose();
  }

  return (
    <Modal
      open={open}
      title="添加秘钥"
      width={650}
      onOk={() => {
        trackClick('create_ppk_ok', '添加秘钥');
        addNewKey();
      }}
      onCancel={() => {
        trackClick('cancel_ppk_modal', '取消添加秘钥');
        closeModal();
      }}
      footer={[
        <Button
          key="back"
          onClick={() => {
            trackClick('back_ppk', '取消');
            onClose();
          }}
        >
          取消
        </Button>,
        <Button
          key="download"
          onClick={() => {
            trackClick('download_ppk', '下载秘钥');
            startDownPPK();
          }}
        >
          下载秘钥
        </Button>,
        <Button
          key="submit"
          type="primary"
          onClick={() => {
            trackClick('submit_ppk', '确定添加');
            addNewKey();
          }}
        >
          确定添加
        </Button>,
      ]}
    >
      <p>
        公钥设置,公钥用于加密数据存储,如果不设置公钥,数据将以明文存储
        <strong>不建议</strong>。
        <Button
          type="link"
          size="small"
          onClick={() => {
            trackClick('genKeys_ppk', '生成秘钥');
            genKeys();
          }}
        >
          生成秘钥
        </Button>
        <Upload
          showUploadList={false}
          beforeUpload={async (file) => {
            const keys = loadPem(await file.text());
            setPriKey(keys.private);
            setPubKey(keys.public);
            return false;
          }}
        >
          <Button
            type="link"
            size="small"
            onClick={() => {
              trackClick('upload_ppk', '上传秘钥');
            }}
          >
            上传秘钥
          </Button>
        </Upload>
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
