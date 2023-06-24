import {
  FolderOutlined,
  CopyOutlined,
  ScissorOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import {
  Input,
  Popconfirm,
  Button,
  List,
  InputRef,
  message,
  Select,
} from 'antd';
import copy from 'copy-to-clipboard';
import dayjs from 'dayjs';
import { Book, db } from '../Data';
import { trackClick } from '../tracker';
import { getReasonText } from '../utils';
import { useLiveQuery } from 'dexie-react-hooks';
import { useRef, useState, useEffect } from 'react';
const { Option } = Select;

const selectBefore = (defaultValue?: string, onChange?: any) => (
  <Select value={defaultValue || 'https'} onChange={onChange}>
    <Option value="http">http://</Option>
    <Option value="https">https://</Option>
  </Select>
);

export function BookSetting({ onFolderAdd }: { onFolderAdd: () => void }) {
  const inputRef = useRef<InputRef>(null);
  const node = useLiveQuery(() => db.nodes.toCollection().first(), []);
  const folders = useLiveQuery(() => db.books.toArray(), []);
  const [title, setTitle] = useState('');
  const [editBook, setBookEdit] = useState<Book>();
  const [nodeUrl, setNodeEdit] = useState(node?.url);
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    setNodeEdit(node?.url);
  }, [node]);

  async function checkNodeEditEnd(e: React.KeyboardEvent) {
    if (e.key !== 'Enter') {
      return;
    }
    node!.url = nodeUrl!;
    await db.updateNodeUrl(node!);
  }

  function handChangeBefore(v: string) {
    const urls = nodeUrl?.split('://') || [];
    urls[0] = v;
    setNodeEdit(urls?.join('://'));
  }

  function handleHostName(v: string) {
    const urls = nodeUrl?.split('://') || [];
    urls[1] = v;
    setNodeEdit(urls?.join('://'));
  }

  function startEditTitle(item: Book) {
    if (!editBook) {
      setTitle(item.title || '记事本');
    }
    setBookEdit(item);
  }

  async function checkEditEnd(e: React.KeyboardEvent) {
    if (e.key !== 'Enter') {
      return;
    }
    editBook!.title = title;
    await db.updateBookTitle(editBook!);
    setBookEdit(undefined);
  }

  return (
    <>
      {contextHolder}
      <p>
        选择一个IPFS网络接入节点,数据会优先存储到当前节点,但是其他节点也能访问,不强依赖某个服务节点限制。
      </p>
      <Input
        ref={inputRef}
        addonBefore={selectBefore(nodeUrl?.split('://')[0], handChangeBefore)}
        value={nodeUrl?.split('://')[1]}
        onBlur={(e) => {
          setNodeEdit(node?.url);
        }}
        onKeyDown={(e) => checkNodeEditEnd(e)}
        onChange={(e) => {
          handleHostName(e.target.value);
        }}
        onFocus={() =>
          inputRef.current!.focus({
            cursor: 'all',
          })
        }
      />
      <p>记事本目录</p>
      <List
        itemLayout="horizontal"
        dataSource={folders}
        renderItem={(item) => (
          <List.Item>
            <List.Item.Meta
              avatar={<FolderOutlined style={{ fontSize: 26 }} />}
              title={
                <span>
                  {editBook !== item ? (
                    <span
                      title="修改记事本名称"
                      onClick={() => {
                        trackClick('modify_folder', '修改记事本名称', item);
                        startEditTitle(item);
                      }}
                    >
                      {item.title || '记事本'}
                      {!item.enabled ? '(删除中...)' : ''}
                    </span>
                  ) : null}
                  {editBook === item ? (
                    <Input
                      value={title}
                      style={{ width: 80 }}
                      size="small"
                      autoFocus
                      onBlur={(e) => setBookEdit(undefined)}
                      onKeyDown={(e) => checkEditEnd(e)}
                      onChange={(e) => setTitle(e.target.value)}
                    ></Input>
                  ) : null}
                  <CopyOutlined
                    title="复制文件夹"
                    onClick={() => {
                      trackClick('copy_folder', '复制文件夹', item);
                      const ret = copy(item.name);
                      ret
                        ? messageApi.success('复制完成' + item.name)
                        : messageApi.error('复制失败');
                    }}
                  ></CopyOutlined>
                  {item.hash && (
                    <ScissorOutlined
                      title="迁移文件夹"
                      onClick={() => {
                        trackClick('migrate_folder', '迁移文件夹', item);
                        const ret = copy(item.hash!);
                        ret
                          ? messageApi.success('复制完成' + item.hash!)
                          : messageApi.error('复制失败');
                      }}
                    ></ScissorOutlined>
                  )}
                  <Popconfirm
                    title="删除后将移除记事本?"
                    onConfirm={() => {
                      trackClick('delete_folder', '删除后将移除记事本', item);
                      db.deleteBook(item.id!);
                    }}
                    okText="删除"
                    cancelText="取消"
                  >
                    <DeleteOutlined title="删除文件夹" />
                  </Popconfirm>
                </span>
              }
              description={
                <span title={item.hash}>
                  {item.name}{' '}
                  <span
                    title={getReasonText(item.reason)}
                    onClick={() => {
                      trackClick(
                        'resync_folder_setting',
                        '重新同步文件夹',
                        item
                      );
                      db.resyncBook(item);
                    }}
                  >
                    {item.syncAt ? dayjs(item.syncAt).fromNow() : ''}
                    {item.reason && item.reason !== 'success'
                      ? '(同步失败...)'
                      : item.syncAt
                      ? ''
                      : '(同步中...)'}
                  </span>
                </span>
              }
            />
          </List.Item>
        )}
      />
      <p>
        <Button
          onClick={() => {
            trackClick('new_folder', '添加新目录');
            onFolderAdd();
          }}
        >
          添加新目录
        </Button>
      </p>
    </>
  );
}
