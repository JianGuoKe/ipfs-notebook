import React from 'react';
import ReactDOM from 'react-dom/client';
import NoteBook from './NoteBook';
import './index.less';
import { ConfigProvider } from 'antd';
import { db } from './Data';
import { start } from './Node';
import './tracker';

console.log(
  '%c[邀请]:你已经看到这了,可以来github共建此项目 https://github.com/JianGuoKe/ipfs-notebook',
  'color: #43bb88; font-weight: bold; '
);

db.init()
  .then(start)
  .then(() => {
    ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
      <React.StrictMode>
        <ConfigProvider
          theme={{
            token: {
              colorPrimary: '#ebc33f',
            },
          }}
        >
          <NoteBook />
        </ConfigProvider>
      </React.StrictMode>
    );
  });
