
const path = require('path');

module.exports = {
  extends: [
    "plugin:react/recommended",
    path.resolve(__dirname, './javascript.js'),
  ],
  plugins: [
    'react'
  ],
  rules: {
    // 布尔值类型的 propTypes 的 name 必须为 is 或 has 开头
    'react/boolean-prop-naming': 0,
    // 一个 defaultProps 必须有对应的 propTypes
    'react/default-props-match-prop-types': 0,
    // 组件必须有 displayName 属性
    // @off 不强制要求写 displayName
    'react/display-name': 0,
    // 禁止在自定义组件中使用一些指定的 props
    // @off 没必要限制
    'react/forbid-component-props': 0,
    // 禁止使用一些指定的 elements
    // @off 没必要限制
    'react/forbid-elements': 0,
    // 禁止使用一些指定的 propTypes
    'react/forbid-prop-types': 0,
    // 禁止直接使用别的组建的 propTypes
    'react/forbid-foreign-prop-types': 0,
    // 禁止使用数组的 index 作为 key
    // @off 太严格了
    'react/no-array-index-key': 0,
    // 禁止使用 children 做 props
    'react/no-children-prop': 2,
    // 禁止使用 dangerouslySetInnerHTML
    // @off 没必要限制
    'react/no-danger': 0,
    // 禁止在使用了 dangerouslySetInnerHTML 的组建内添加 children
    'react/no-danger-with-children': 2,
    // 禁止使用已废弃的 api
    'react/no-deprecated': 2,
    // 禁止在 componentDidMount 里面使用 setState
    // @off 同构应用需要在 didMount 里写 setState
    'react/no-did-mount-set-state': 0,
    // 禁止在 componentDidUpdate 里面使用 setState
    'react/no-did-update-set-state': 2,
    // 禁止直接修改 this.state
    'react/no-direct-mutation-state': 2,
    // 禁止使用 findDOMNode
    'react/no-find-dom-node': 0,
    // 禁止使用 isMounted
    'react/no-is-mounted': 2,
    // 禁止在一个文件创建两个组件
    // @off 有一个 bug https://github.com/yannickcr/eslint-plugin-react/issues/1181
    'react/no-multi-comp': 0,
    // 禁止在 PureComponent 中使用 shouldComponentUpdate
    'react/no-redundant-should-component-update': 2,
    // 禁止使用 ReactDOM.render 的返回值
    'react/no-render-return-value': 2,
    // 禁止拼写错误
    'react/no-typos': 2,
    // 禁止使用字符串 ref
    'react/no-string-refs': 2,
    // 禁止在组件的内部存在未转义的 >, ", ' 或 }
    'react/no-unescaped-entities': 2,
    // @fixable 禁止出现 HTML 中的属性，如 class
    'react/no-unknown-property': 2,
    // 禁止出现未使用的 propTypes
    'react/no-unused-prop-types': 0,
    // 定义过的 state 必须使用
    // @off 没有官方文档，并且存在很多 bug： https://github.com/yannickcr/eslint-plugin-react/search?q=no-unused-state&type=Issues&utf8=%E2%9C%93
    'react/no-unused-state': 0,
    // 禁止在 componentWillUpdate 中使用 setState
    'react/no-will-update-set-state': 2,
    // 必须使用 Class 的形式创建组件
    'react/prefer-es6-class': [
      2,
      'always'
    ],
    // 组件必须写 propTypes

    'react/prop-types': 1,
    // 出现 jsx 的地方必须 import React
    'react/react-in-jsx-scope': 0,
    // 非 required 的 prop 必须有 defaultProps

    'react/require-default-props': 0,
    // render 方法中必须有返回值
    'react/require-render-return': 2,
    // @fixable 组件内没有 children 时，必须使用自闭和写法
    'react/self-closing-comp': 2,
    // @fixable 组件内方法必须按照一定规则排序
    'react/sort-comp': 2,
    // style 属性的取值必须是 object
    'react/style-prop-object': 2,
    // HTML 中的自闭和标签禁止有 children
    'react/void-dom-elements-no-children': 2,
    // @fixable 自闭和标签的反尖括号必须与尖括号的那一行对齐
    'react/jsx-closing-bracket-location': [
      2,
      {
        nonEmpty: false,
        selfClosing: 'line-aligned'
      }
    ],
    // @fixable 结束标签必须与开始标签的那一行对齐
    // @off 已经在 jsx-indent 中限制了
    'react/jsx-closing-tag-location': 0,
    // @fixable 大括号内前后禁止有空格
    'react/jsx-curly-spacing': [
      2,
      {
        when: 'never',
        attributes: {
          allowMultiline: true
        },
        children: true,
        spacing: {
          objectLiterals: 'never'
        }
      }
    ],
    // @fixable props 与 value 之间的等号前后禁止有空格
    'react/jsx-equals-spacing': [
      2,
      'never'
    ],
    // 限制文件后缀
    'react/jsx-filename-extension': 0,
    // @fixable 第一个 prop 必须得换行
    'react/jsx-first-prop-new-line': 0,
    // handler 的名称必须是 onXXX 或 handleXXX
    'react/jsx-handler-names': 0,
    // @fixable jsx 的 children 缩进必须为2个空格
    'react/jsx-indent': [
      2,
      2
    ],
    // @fixable jsx 的 props 缩进必须为2个空格
    'react/jsx-indent-props': [
      2,
      2
    ],
    // 数组中的 jsx 必须有 key
    'react/jsx-key': 2,
    // @fixable 限制每行的 props 数量
    'react/jsx-max-props-per-line': 0,
    // jsx 中禁止使用 bind
    'react/jsx-no-bind': 0,
    // 禁止在 jsx 中使用像注释的字符串
    'react/jsx-no-comment-textnodes': 2,
    // 禁止出现重复的 props
    'react/jsx-no-duplicate-props': 2,
    // 禁止在 jsx 中出现字符串
    'react/jsx-no-literals': 0,
    // 禁止使用 target="_blank"
    // @off 没必要限制
    'react/jsx-no-target-blank': 0,
    // 禁止使用未定义的 jsx elemet
    'react/jsx-no-undef': 2,
    // 禁止使用 pascal 写法的 jsx，比如 <TEST_COMPONENT>
    'react/jsx-pascal-case': 2,
    // @fixable jsx 的开始和闭合处禁止有空格
    'react/jsx-tag-spacing': [
      2,
      {
        closingSlash: 'never',
        beforeSelfClosing: 'always',
        afterOpening: 'never'
      }
    ],
    "react/jsx-wrap-multilines": 1
  }
};