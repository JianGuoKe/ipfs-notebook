import React from 'react';
import ReactDOM from 'react-dom/client';
import NoteBook from './NoteBook';
import './index.less';
import { ConfigProvider } from 'antd';
import { db } from './Data';
import { start } from './Node';

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
