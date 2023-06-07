import React from 'react';
import ReactDOM from 'react-dom/client';
import NoteBook from './NoteBook';
import './index.less';
import { ConfigProvider } from 'antd';
import { db } from './Data';
import { start } from './Node';
import './tracker';
import { px2remTransformer, StyleProvider } from '@ant-design/cssinjs';

console.log(
  `
    __ _____ _____ _____ _____ _____ _____ _____ _____ 
 __|  |     |  _  |   | |   __|  |  |     |  |  |   __|
|  |  |-   -|     | | | |  |  |  |  |  |  |    -|   __|
|_____|_____|__|__|_|___|_____|_____|_____|__|__|_____|
`
);
console.log(
  '%c     [邀请]:你已经看到这了,可以来github共建此项目',
  'color: #43bb88; font-weight: bold; '
);
console.log(
  '   https://github.com/JianGuoKe/ipfs-notebook'
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
          <StyleProvider
            transformers={[
              px2remTransformer({
                rootValue: 16,
              }),
            ]}
          >
            <NoteBook />
          </StyleProvider>
        </ConfigProvider>
      </React.StrictMode>
    );
  });
