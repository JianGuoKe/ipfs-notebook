import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { createStyleImportPlugin, AntdResolve } from 'vite-plugin-style-import'
import { createHtmlPlugin } from 'vite-plugin-html'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    createHtmlPlugin({
      minify: true,
      pages: [
        {
          filename: 'index.html',
          template: 'index.html',
          injectOptions: {
            data: {
              manifest: 'manifest.json',
              serviceWorker: 'serviceWorker.js'
            }
          },
        }
      ],
    }),
    createStyleImportPlugin({
      resolves: [AntdResolve()]
    })]
})
