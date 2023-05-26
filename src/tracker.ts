import SlsTracker from '@aliyun-sls/web-track-browser';

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
  },
};
const tracker = new SlsTracker(opts);

tracker.send({
  page: document.title,
  type: 'open',
  ua: navigator.userAgent,
  referer: document.referrer,
});
