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