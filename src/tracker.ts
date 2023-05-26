import SlsTracker from '@aliyun-sls/web-track-browser';

let tracker: SlsTracker;

try {
  const opts = {
    host: 'cn-zhangjiakou.log.aliyuncs.com', // 所在地域的服务入口。例如cn-hangzhou.log.aliyuncs.com
    project: 'jianguoke', // Project名称。
    logstore: 'uba', // Logstore名称。
    time: 10, // 发送日志的时间间隔，默认是10秒。
    count: 10, // 发送日志的数量大小，默认是10条。
    topic: 'notebook', // 自定义日志主题。
    source: location.hostname,
    tags: {
      cid: new Date().getTime().toString(),
      ua: navigator.userAgent,
      referer: document.referrer,
    },
  };
  tracker = new SlsTracker(opts);

  tracker.send({
    page: document.title,
    type: 'open',
  });
} catch (err) {
  console.error(err);
}

export function trackClick(id: string, name?: string, opts?: any) {
  try {
    tracker?.send({
      page: document.title,
      type: 'click',
      id,
      name,
      opts,
    });
    // console.info({
    //   page: document.title,
    //   type: 'click',
    //   id,
    //   name,
    //   opts,
    // });
  } catch (err) {
    console.error(err);
  }
}
