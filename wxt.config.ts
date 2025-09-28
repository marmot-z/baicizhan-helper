import { defineConfig } from 'wxt';
import path from 'node:path';
import pkg from './package.json';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  outDir: "dist",
  
  // 路径别名配置
  alias: {
    '@': path.resolve(__dirname, './src'),
  },
  
  vite: () => ({
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    publicDir: path.resolve(__dirname, './public'),
    define: {
      __DEV__: JSON.stringify(process.env.NODE_ENV === 'development'),
    },
    server: {
      port: 5173,
      cors: {
        origin: '*',
        credentials: true,
      },
    },
  }),
  
  // Manifest配置
  manifest: {
    name: pkg.name,
    description: pkg.description,
    version: pkg.version,
    icons: {
      48: '/logo.png',
    },
    action: {
      default_icon: {
        48: '/logo.png',
      },
    },
    permissions: [
      'storage'
    ],
    host_permissions: [
      'http://www.baicizhan-helper.cn/*',
      'https://www.baicizhan-helper.cn/*',
      "http://127.0.0.1:8765/*",
      "http://localhost:8765/*"
    ],
  },
  
  // 构建输出配置
  zip: {
    name: `${pkg.name}-${pkg.version}.zip`,
  },
});