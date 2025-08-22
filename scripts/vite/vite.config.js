import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import replace from '@rollup/plugin-replace';
import path, { resolve } from 'path';
import { resolvePkgPath } from '../rollup/utils';


// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      // 移除排除配置，让 Vite 正确处理 JSX
    }),
    replace({
      __DEV__: true,
      preventAssignment: true,
    })
  ],
  resolve:{
    alias:[
      {
        find:'react',
        replacement:resolvePkgPath('react')
      },
      {
        find:'react-dom',
        replacement:resolvePkgPath('react-dom')
      },
      {
        find:'react-noop-renderer',
        replacement:resolvePkgPath('react-noop-renderer')
      },
      {
        find:'hostConfig',
        replacement: path.resolve(
          resolvePkgPath('react-dom'),
          './src/hostConfig.ts')
      },
      {
        find:'react/jsx-runtime',
        replacement:resolvePkgPath('react') + '/jsx-runtime'
      },
      {
        find:'react/jsx-dev-runtime',
        replacement:resolvePkgPath('react') + '/jsx-dev-runtime'
      }
    ]
  }
})
