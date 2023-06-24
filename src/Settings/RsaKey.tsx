import {
  KeyOutlined,
  CopyOutlined,
  DownloadOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { Popconfirm, Button, List, message } from 'antd';
import copy from 'copy-to-clipboard';
import dayjs from 'dayjs';
import { db } from '../Data';
import { trackClick } from '../tracker';
import { createPem, download } from '../utils';
import { useLiveQuery } from 'dexie-react-hooks';

export function RsaKey({ onPPKAdd }: { onPPKAdd: () => void }) {
  const keys = useLiveQuery(() => db.keys.toArray(), []);
  const [messageApi, contextHolder] = message.useMessage();

  return (
    <>
      {contextHolder}
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
                      const ret = copy(createPem(item.pubKey, item.priKey));
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
                  <div>{dayjs(item.createAt).locale('zh-cn').fromNow()}</div>
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
    </>
  );
}
