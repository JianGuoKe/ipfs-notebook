import { trackClick } from './tracker';
import WebSocket from 'isomorphic-ws';

export function connectWsChannel(
  clientId: string,
  code: string,
  onReady?: (ok: boolean, clients?: string[], ws?: WebSocket) => void,
  onMessage?: (type: string, message: any, ws: WebSocket) => void
) {
  let isClosing = false;

  const ws = new WebSocket(
    process.env.NODE_ENV === 'production'
      ? 'wss://ipfs.jianguoke.cn/ws'
      : 'ws://localhost:9201'
  );

  ws.onopen = function open() {
    // console.log('connected');
    trackClick('wsOpen');
    ws.send(JSON.stringify({ command: 'id', id: clientId }));
    ws.send(
      JSON.stringify({ command: 'join', channel: 'notebook_sync_' + code })
    );
  };

  ws.onclose = function close() {
    trackClick('wsClose');
    if (isClosing) {
      return;
    }
    onReady && onReady(false);
  };

  ws.onerror = function error(err: any) {
    trackClick('wsError', err.message);
    onReady && onReady(false);
  };

  ws.onmessage = function incoming({ data }: any) {
    // console.log(`received ${data}`);
    try {
      data = JSON.parse(data);
    } catch (err) {
      return console.error(err);
    }
    trackClick('wsMessage', data.command);
    if (data.command === 'joined' && data.clients.includes(clientId)) {
      onReady && onReady(true, data.clients, ws);
    } else if (
      (data.command === 'exited' || data.command === 'kickout') &&
      data.clientId === clientId
    ) {
      onReady && onReady(false);
    } else if (data.command === 'sent') {
      onMessage && onMessage(data.type, data.message, ws);
    } else {
      onReady && onReady(false);
    }
  };

  return () => {
    isClosing = true;
    ws.close();
  };
}
