import { Button, InputRef, Modal, Input, message, Popconfirm } from 'antd';
import { useEffect, useRef, useState } from 'react';
import { db } from './Data';
import { trackClick } from './tracker';
import { connectWsChannel } from './Channel';
import { useLiveQuery } from 'dexie-react-hooks';
import { startSync } from './Node';

let dontShowTip = false;
let dispose: () => void;

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
  const [code, setCode] = useState('');
  const [openTip, setOpenTip] = useState(false);
  const [loading, setLoading] = useState(false);
  const folders = useLiveQuery(() => db.books.toArray(), []);
  const options = useLiveQuery(() => db.getOptions(), []);

  function handleNotShowTip() {
    dontShowTip = true;
    setOpenTip(false);
  }

  useEffect(() => {
    setMode(mode);
    setOpenTip(false);
    setCode('');
  }, [mode]);

  function handleClose() {
    dispose && dispose();
    setLoading(false);
    setOpenTip(false);
    setTimeout(() => {
      onClose && onClose();
      setMode(mode);
      setCode('');
    }, 0);
  }

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        setOpenTip(mode === 'add' || mode === 'add_only');
      }, 400);
    }
  }, [open]);

  async function addNewHash() {
    try {
      await db.createEmptyBook('');
      handleClose();
      setMode('create');
    } catch (err) {
      message.error((err as Error).message);
    }
  }

  async function addHashFromCode() {
    if (!code || code.length < 6) {
      return message.warning('同步码无效');
    }
    setLoading(true);
    dispose = connectWsChannel(
      options!.clientId!,
      code.toString(),
      (ready, clients, ws) => {
        if (ready) {
          if (clients?.length! > 1) {
            ws!.send(
              JSON.stringify({
                command: 'send',
                type: 'getFolders',
              })
            );
          } else {
            message.error('同步码不存在');
            dispose();
            setLoading(false);
          }
        } else {
          dispose();
          message.error('连接失败!稍后重试');
          setLoading(false);
        }
      },
      async (type, data, ws) => {
        if (type === 'folders') {
          try {
            let syncCount = 0;
            for (const folder of data) {
              if (!folders?.some((it) => it.name === folder.name)) {
                const keyName = await db.upsertKey(
                  folder.key.priKey,
                  folder.key.pubKey
                );
                await db.addBook(
                  folder.name,
                  folder.root,
                  folder.hash,
                  folder.title,
                  keyName
                );
                syncCount++;
              }
            }
            ws!.send(
              JSON.stringify({
                command: 'send',
                type: 'syncEnd',
              })
            );
            startSync();
            message.success(
              syncCount > 0 ? `同步${syncCount}个文件夹完成` : '无需同步'
            );
            if (syncCount > 0) {
              handleClose();
            } else {
              dispose();
              setLoading(false);
            }
          } catch (err) {
            message.error((err as Error).message);
          }
        }
      }
    );
  }

  const footer = [];
  if (newMode === 'add' || newMode === 'add_only') {
    footer.push(
      newMode === 'add' && (
        <Button
          key="new"
          onClick={() => {
            trackClick('new_folder', '创建新文件夹');
            addNewHash();
          }}
        >
          创建新文件夹
        </Button>
      ),
      <Button
        key="back"
        onClick={() => {
          trackClick('back_folder', '取消');
          handleClose();
        }}
      >
        取消
      </Button>,
      <Button
        key="submit"
        type="primary"
        loading={loading}
        onClick={() => {
          trackClick('submit_sync', '开始同步');
          addHashFromCode();
        }}
      >
        开始同步
      </Button>
    );
  }
  if (newMode === 'create') {
    footer.push(
      <Button
        key="submit"
        onClick={() => {
          trackClick('sync_folder', '同步文件夹');
          setMode('add');
          setOpenTip(true);
        }}
      >
        同步文件夹
      </Button>,
      <Button
        key="back"
        onClick={() => {
          trackClick('cancel_folder', '取消');
          handleClose();
        }}
      >
        取消
      </Button>,
      <Button
        key="new"
        type={'primary'}
        onClick={() => {
          trackClick('create_folder', '创建新文件夹');
          addNewHash();
        }}
      >
        创建新文件夹
      </Button>
    );
  }
  const title = newMode === 'add_only' ? '同步' : '添加';
  return (
    <Modal
      open={open}
      title={title + '记事本'}
      onOk={() => {
        trackClick('create_folder_ok', '新文件夹');
        addNewHash();
      }}
      onCancel={() => {
        trackClick('cancel_folder_modal', '取消创建文件夹');
        handleClose();
      }}
      footer={footer}
    >
      <p>{title}一个去中心化网络(IPFS)上的文件夹作为当前记事本</p>
      {(newMode === 'add' || newMode === 'add_only') && (
        <Popconfirm
          zIndex={9999}
          showCancel={false}
          open={openTip && !dontShowTip}
          onConfirm={() => handleNotShowTip()}
          okText="知道了"
          title={'如何获取同步码'}
          description={'打开要同步的设备上记事本 [设置]-[数据同步]-[同步码]'}
        >
          <Input
            ref={inputPriRef}
            placeholder="输入同步码"
            value={code}
            maxLength={6}
            onChange={(e) => {
              setOpenTip(false);
              setCode(e.target.value);
            }}
            onFocus={() => {
              inputPriRef.current!.focus({
                cursor: 'all',
              });
            }}
          />
        </Popconfirm>
      )}
    </Modal>
  );
}
