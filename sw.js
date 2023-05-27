// serviceWorker
// 检查serviceWorker属性是否可用
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    navigator.serviceWorker
      .register('serviceWorker.js')
      .then((res) => {
        console.log('service worker registered');
      })
      .catch((err) => {
        console.log('service worker not registered', err);
      });
  });
}
