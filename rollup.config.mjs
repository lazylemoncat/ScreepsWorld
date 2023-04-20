import typescript from 'rollup-plugin-typescript2';

export default {
// ���� rollup ��Ҫ���ʲô
  // Դ�����������ĸ��ļ�
  input: 'src/main.ts',
  plugins: [
    // �༭ts
    typescript({tsconfig: "./tsconfig.json"}),
  ],
  // ������������
  output: {
      // ������ĸ��ļ�
      file: 'dist/main.js',
      format: 'cjs',
  }
};