const path = require('path');

module.exports = {
  extends: [
    path.resolve(__dirname, './react.js'),
    path.resolve(__dirname, './typescript.js')
  ],
  rules: {
    //
    // 覆盖掉 eslint-plugin-react 的规则
    //
    // @fixable 限制 jsx 的 children 缩进规则
    // @off 开启的话 eslint 会报错 Cannot read property 'type' of null
    'react/jsx-indent': 0,
    // 组件内方法必须按照一定规则排序
    // @off 还不支持 properties https://github.com/yannickcr/eslint-plugin-react/issues/1342
    'react/sort-comp': 0
  }
};