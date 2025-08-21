import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import replace from '@rollup/plugin-replace';
import path, { resolve } from 'path';
import { resolvePkgPath } from '../rollup/utils';


// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      // 关键配置：排除 demo 文件，避免注入热更新代码导致警告
      // 匹配 demos/test-fc 目录下的 main.tsx 文件
      exclude: /demos\/test-fc\/main\.tsx$/
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
          resolvePkgPath('react-noop-renderer'),
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
