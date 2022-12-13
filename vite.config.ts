import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { createStyleImportPlugin, AntdResolve } from 'vite-plugin-style-import'
import { createHtmlPlugin } from 'vite-plugin-html'
import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill'

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      stream: "stream-browserify",
      crypto: 'crypto-browserify'
    },
  },
  build: { sourcemap: true },
  optimizeDeps: {
    esbuildOptions: {
      // Node.js global to browser globalThis
      define: {
        global: "globalThis",
      },
      // Enable esbuild polyfill plugins
      plugins: [
        NodeGlobalsPolyfillPlugin({
          // buffer: true,
        }),
      ],
    },
  },
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
