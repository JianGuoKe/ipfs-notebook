export function download(filename: string, text: string) {
  var element = document.createElement('a');
  element.setAttribute(
    'href',
    'data:text/plain;charset=utf-8,' + encodeURIComponent(text)
  );
  element.setAttribute('download', filename);

  element.style.display = 'none';
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
}

export function getBrowserWidth() {
  if (window.innerWidth < 768) {
    return 'xs';
  } else if (window.innerWidth < 991) {
    return 'sm';
  } else if (window.innerWidth < 1199) {
    return 'md';
  } else {
    return 'lg';
  }
}

export function createPem(pubKey: string, priKey: string) {
  return (
    (pubKey.includes('PUBLIC KEY')
      ? ''
      : '-----BEGIN RSA PUBLIC KEY-----\r\n') +
    pubKey +
    (pubKey.includes('PUBLIC KEY')
      ? ''
      : '\r\n-----END RSA PUBLIC KEY-----\r\n') +
    (priKey.includes('PRIVATE KEY')
      ? ''
      : '-----BEGIN RSA PRIVATE KEY-----\r\n') +
    priKey +
    (priKey.includes('PRIVATE KEY') ? '' : '\r\n-----END RSA PRIVATE KEY-----')
  );
}

export function loadPem(txt: string, comment = true) {
  const lines = txt
    .split('\n')
    .filter((notemptyline) => notemptyline)
    .map((txt) => txt.replace('\r', ''));
  let isPub = false;
  let isPri = false;
  const keys = { public: '', private: '' };
  for (const line of lines) {
    if (
      line.startsWith('--') &&
      line.includes('PUBLIC KEY') &&
      line.endsWith('--')
    ) {
      isPub = true;
      isPri = false;
      if (!comment) {
        continue;
      }
    }
    if (
      line.startsWith('--') &&
      line.includes('PRIVATE KEY') &&
      line.endsWith('--')
    ) {
      isPri = true;
      isPub = false;
      if (!comment) {
        continue;
      }
    }
    if (isPub) {
      if (keys.public) {
        keys.public += '\n';
      }
      keys.public += line;
    }
    if (isPri) {
      if (keys.private) {
        keys.private += '\n';
      }
      keys.private += line;
    }
  }
  return keys;
}

export function getReasonText(reason: string | undefined) {
  switch (reason) {
    case 'nokey':
      return '没有秘钥无法加密存储';
    case 'cidconflict':
      return '远程更新冲突';
    case 'nobook':
      return '记事本未找到';
    case 'success':
      return '';
    case undefined:
      return '';
    default:
      return reason;
  }
}

export function formatStringLen(
  strVal: string,
  len: number,
  padChar: string = ' '
) {
  if (!strVal) {
    return padChar.repeat(len);
  } else {
    const strLen = strVal.length;
    if (strLen > len) {
      return strVal.substring(0, len);
    } else if (strLen < len) {
      return strVal.padEnd(len, padChar);
    } else {
      return strVal;
    }
  }
}

export function openDev(category = '') {
  window.open(`https://dev.jianguoke.cn/${category}`, 'dev');
}
