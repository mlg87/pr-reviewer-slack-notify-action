module.exports = {
  "extends": [
    "eslint:recommended",
    "plugin:import/errors",
    "plugin:import/warnings"
  ],
  "root": true,
  "parser": "babel-eslint",
  "plugins": [
    "react",
  ],
  "parserOptions": {
    "ecmaVersion": 6,
    "sourceType": "module",
    "module": true,
    "ecmaFeatures": {
      "jsx": true,
      "module": true,
      "experimentalObjectRestSpread": true
    }
  },
  "env": {
    "es6": true,
    "browser": true,
    "node": true,
    "jquery": true,
    "jest": true
  },
  "rules": {
    "indent": ["error", 2],
    "quotes": 0,
    "no-console": 1,
    "no-debugger": 1,
    "no-var": 2,
    "no-unused-vars": 2,
    "import/named": 0,
    "semi": [2, "always"],
    "eol-last": 0,
    "no-underscore-dangle": 0,
    "no-alert": 0,
    "no-lone-blocks": 0,
    "jsx-quotes": 0,
    "no-eq-null": 2,
    "no-extra-parens": 0,
    "no-irregular-whitespace": 2,
    "no-multi-spaces": 1,
    "no-trailing-spaces": 1,
    "padded-blocks": 0,
    "one-var": 0,
    "space-before-function-paren": [2, "always"],
    "key-spacing": [2, { "beforeColon": false, "afterColon": true }],
    "comma-dangle": [0, "never"],
    "no-multiple-empty-lines": [2, { "max": 1 }],
    "no-mixed-spaces-and-tabs": [2, false],
    "import/extensions": 1,
    "import/no-unresolved": 0,
    "no-callback-literal": 0,
    "no-useless-escape": 0
  },
  "globals": {
    "window": true,
    "document": true,
    "sessionStorage": true,
    "localStorage": true,
    "process": true,
  }
};
