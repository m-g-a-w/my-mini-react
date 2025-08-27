import {getPackageJSON,resolvePkgPath,getBaseRollupPlugins} from './utils.js';
import generatePackageJson from 'rollup-plugin-generate-package-json';
import path from 'path';

const name = getPackageJSON('react-reconciler').name;
//react-reconciler包的路径
const pkgPath = resolvePkgPath(name);
//react-reconcilerDist包的路径
const pkgDistPath = resolvePkgPath(name,true);

export default [
  //打包react-reconciler包
  {
    input: `${pkgPath}/index.ts`,
    output: {
      file: `${pkgDistPath}/index.js`,
      name: 'ReactReconciler',
      format: 'umd', //兼容CJS与EMS格式
    },
    plugins: [
      ...getBaseRollupPlugins(),
      generatePackageJson({
        inputFolder: pkgPath,
        outputFolder: pkgDistPath,
        baseContents: ({name,description,version}) => ({
          name,description,version,
          main: 'index.js'
        })
      })
    ]
  }
]; 