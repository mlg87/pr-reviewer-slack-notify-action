module.exports = {
  'env': {
    'browser': true,
    'es2021': true
  },
  'extends': ['eslint:recommended', 'plugin:@typescript-eslint/recommended', 'prettier'],
  'parser': '@typescript-eslint/parser',
  'parserOptions': {
    'ecmaVersion': 12,
    'sourceType': 'module'
  },
  'plugins': ['import', '@typescript-eslint'],
  'rules': {
    'import/order': ['error', {
      alphabetize: {
        caseInsensitive: false,
        order: 'asc'
      },
      groups: ['object', 'builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
      'newlines-between': 'always'
    }],
    'indent': ['error', 2],
    'linebreak-style': ['error', 'unix'],
    'quotes': ['error', 'single'],
    'semi': ['error', 'always']
  }
};