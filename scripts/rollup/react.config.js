import {getPackageJSON,resolvePkgPath,getBaseRollupPlugins} from './utils.js';
import generatePackageJson from 'rollup-plugin-generate-package-json';

const name = getPackageJSON('react').name;
//react包的路径
const pkgPath = resolvePkgPath(name);
//reactDist包的路径
const pkgDistPath = resolvePkgPath(name,true);
export default [
  //打包react包
  {
    input: `${pkgPath}/index.ts`,
    output: {
      file: `${pkgDistPath}/index.js`,
      name: 'index.js',
      format: 'umd', //兼容CJS与EMS格式
    },
    plugins: [...getBaseRollupPlugins(),generatePackageJson({
      inputFolder: pkgPath,
      outputFolder: pkgDistPath,
      baseContents: ({name,description,version}) => ({
        name,description,version,
        main: 'index.js'
      })
    })]
  },
  //打包jsx-runtime包
  {
    input: `${pkgPath}/src/jsx.ts`,
    output: 
    [
      //jsx-runtime
      {
        file: `${pkgDistPath}/jsx-runtime.js`,
        name: 'jsx-runtime.js',
        format: 'umd', //兼容CJS与EMS格式
      },
      //jsx-dev-runtime
      {
        file: `${pkgDistPath}/jsx-dev-runtime.js`,
        name: 'jsx-dev-runtime.js',
        format: 'umd', //兼容CJS与EMS格式
      }
    ],
    plugins: getBaseRollupPlugins()
  }
]