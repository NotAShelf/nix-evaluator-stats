import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';

export default [
  ...tseslint.configs.recommended,
  eslintConfigPrettier,
  {
    files: ['**/*.{ts,tsx}'],
    ignores: ['dist/', 'node_modules/', '.DS_Store', '*.md'],
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
];
