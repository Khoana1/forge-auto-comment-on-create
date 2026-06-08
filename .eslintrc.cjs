module.exports = {
  env: {
    node: true,
    es2022: true,
    jest: true,
  },
  extends: ['eslint:recommended'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  ignorePatterns: ['node_modules/', 'dist/'],
  rules: {
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
  },
};
