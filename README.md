# 1.自动补全
首先下载nodejs
使用vscode打开文件夹
ctrl + shift + ~
执行 npm install @types/screeps
如果想要在screeps中使用lodash库 则执行 npm install @types/lodash@3.10.1
# 2.rollup
执行 npm init -y
执行 npm install -D rollup
在 package.json 中的 scripts 里添加一个build字段：
"build": "rollup -cw",
新建 rollup.config.mjs 并填入以下内容：
export default {
  input: 'src/main.js',
  output: {
    file: 'dist/main.js',
    format: 'cjs',
    sourcemap: true,
  }
}
最后，执行 npm run build 即可
# 3.typescript
新建tsconfig.json,内容如下：
{
  "compilerOptions": {
      "target": "ES2017",
      "moduleResolution": "Node", 
      "outDir": "dist/",
      "baseUrl": "./",
      "sourceMap": true,
      "allowSyntheticDefaultImports": true,
      "paths": {
          "@/*": ["./src/*"]
      },
  },
  "exclude": [
      "node_modules",
      "dist"
  ],
  "include": [
      "src/**/*.ts"
, "src/CreepPototype.js"  ]
}

执行 npm install --save-dev typescript rollup-plugin-typescript2
将 rollup.config.js 改为：

import typescript from 'rollup-plugin-typescript2';
export default {
// 告诉 rollup 他要打包什么
  // 源代码的入口是哪个文件
  input: 'src/main.ts',
  plugins: [
    // 编辑ts
    typescript({tsconfig: "./tsconfig.json"}),
  ],
  // 构建产物配置
  output: {
      // 输出到哪个文件
      file: 'dist/main.js',
      format: 'cjs',
  }
};

最后，将 src 的 main.js 改为 main.ts