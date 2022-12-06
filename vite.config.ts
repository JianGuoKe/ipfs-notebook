import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { createStyleImportPlugin, AntdResolve } from 'vite-plugin-style-import'

// https://vitejs.dev/config/
export default defineConfig({
  base: 'https://static.jianguoke.cn/note',
  plugins: [
    react(),
    createStyleImportPlugin({
      resolves: [AntdResolve()]
    })]
})
