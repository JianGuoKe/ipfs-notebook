import { useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

export default function () {
  const [value, setValue] = useState('');
  return <ReactQuill value={value} onChange={setValue} />;
}
