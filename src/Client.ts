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

// Alternatively, you can set an event listener for `null` which receives all events:
client.addEventListener(null, (event: any) => {
  if (event.type !== events._received && event.type !== events._sent) {
    trackClick('client_event', event.type, event);
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
