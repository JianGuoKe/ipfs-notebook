import { Button, Collapse, ConfigProvider } from 'antd';
import { Scrollbars } from 'react-custom-scrollbars-2';
const { Panel } = Collapse;
import './Settings.less';
import { SyncCode } from './Settings/SyncCode';
import { RsaKey } from './Settings/RsaKey';
import { BookSetting } from './Settings/BookSetting';
import { openDev } from './utils';

const customizeRenderEmpty = () => '未添加设置';

export default function Settings({ onPPKAdd, onFolderAdd }: any) {
  return (
    <ConfigProvider renderEmpty={customizeRenderEmpty}>
      <div className="ipfs-settings">
        <Scrollbars autoHide>
          <Collapse ghost>
            <Panel header="记事本管理" key="ipfsnode">
              <BookSetting onFolderAdd={onFolderAdd}></BookSetting>
            </Panel>
            <Panel header="数据安全" key="rsapk">
              <RsaKey onPPKAdd={onPPKAdd}></RsaKey>
            </Panel>
            {/* <Panel header="账户同步" key="acc">
              <UserSync></UserSync>
            </Panel> */}
            <Panel header="数据同步" key="synccode">
              <SyncCode onFolderAdd={onFolderAdd}></SyncCode>
            </Panel>
            <Panel header="开发者社区" key="dev">
              <p>
                进入开发者社区一起讨论功能问题和改进建议,
                这里你还能看到开发者的改进计划和未来新特性。
              </p>
              <Button onClick={() => openDev()}>打开社区</Button>
            </Panel>
          </Collapse>
        </Scrollbars>
      </div>
    </ConfigProvider>
  );
}
