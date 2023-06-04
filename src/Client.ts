import { LoginClient, events } from 'gbv-login-client';
import { trackClick } from './tracker';
import { useEffect, useState } from 'react';

const loginServer =
  process.env.NODE_ENV === 'production'
    ? 'https://login.jianguoke.cn'
    : 'http://localhost:9900';
const client = new LoginClient(loginServer.split('://')[1], {
  ssl: loginServer.includes('https://'),
});

let retryCount = 0;

// Alternatively, you can set an event listener for `null` which receives all events:
client.addEventListener(null, (event: any) => {
  if (event.type !== events._received && event.type !== events._sent) {
    if (event.type === events.error) {
      if (event.error.message.includes('No reply from server')) {
        // 减少retry的log
        if (retryCount < 3) {
          trackClick(
            'client_event',
            event.type + retryCount,
            event.error.message
          );
        }
        retryCount++;
        if (retryCount > 100) {
          retryCount = 0;
        }
      } else {
        trackClick('client_event', event.type, event.error.message);
      }
    } else {
      trackClick('client_event', event.type);
    }
  }
  switch (event.type) {
    case events.login:
      break;
    case events.logout:
      break;
    default:
      break;
  }
});

export function useLogin() {
  const [loggedInUser, setLoggedInUser] = useState<any>(client.user || null);

  useEffect(() => {
    function login(event: any) {
      setLoggedInUser(event.user);
    }
    function logout() {
      setLoggedInUser(null);
    }
    client.addEventListener(events.login, login);
    client.addEventListener(events.logout, logout);
    return () => {
      client._listeners[events.login].splice(
        client._listeners[events.login].indexOf(login),
        1
      );
      client._listeners[events.logout].splice(
        client._listeners[events.logout].indexOf(logout),
        1
      );
    };
  }, []);

  return loggedInUser;
}

export function logout() {
  if (!client.loggedIn) {
    return;
  }
  window.open(`${loginServer}/logout`, loginServer);
}

export function login(provider: string = 'wechat') {
  if (!client.connected) {
    throw new Error('登录服务器未连接成功,请稍后重试!');
  }
  window.open(`${loginServer}/login/${provider}`, loginServer);
}

// Connect to login server
client.connect();

//   // Access properties
//   client.loggedIn
//   client.user
//   client.providers
//   client.connected
//   client.token
//   client.decodedToken // Decoded, but not verified!
//   client.about

//   // Change the user name at login server
//   client.setName("New Name")

//   // Static properties
//   LoginClient.events    // Object with available events (usage see above)
//   LoginClient.errors    // Object with available error classes
//   LoginClient.jwtDecode // Access to jwtDecode function

//   // If you eventually want to disconnect from login server (fires disconnect event one last time):
//   client.disconnect()

async function handleErrors(response: any) {
  if (!response.ok) {
    throw Error((await response.text()) || response.statusText);
  }
  return response;
}

export async function getFolderList() {
  const obj =
    (await (
      await fetch(`${loginServer}/profile/ipfs.folders`, {
        credentials: 'include',
      }).then(handleErrors)
    ).json()) || {};
  return [obj.value || [], obj.__v];
}

export async function upsertFolderList(value: any[], __v: string) {
  await fetch(`${loginServer}/profile/ipfs.folders`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ value, __v }),
  }).then(handleErrors);
}
