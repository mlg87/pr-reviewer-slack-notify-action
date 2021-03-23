const path = require('path');

module.exports = {
  extends: [
    path.resolve(__dirname, './javascript.js')
  ],
  parser: 'typescript-eslint-parser',
  plugins: [
    'typescript'
  ],
  rules: {
    //
    // 覆盖掉 ESLint 的规则
    //
    // 禁止使用未定义的变量
    // @off 接口定义会报错
    'no-undef': 0,
    // 注释的斜线或 * 后必须有空格
    // @off 三斜线注释会报错
    'spaced-comment': 0,
    // 函数有重载时，必须将重载成员分组在一起
    // @off 该规则现在有 bug https://github.com/AlloyTeam/eslint-config-alloy/issues/38
    'typescript/adjacent-overload-signatures': 0,
    // 类和接口的命名必须遵守帕斯卡命名法，比如 PersianCat
    'typescript/class-name-casing': 2,
    // 必须手动指定类的属性和方法的可访问性（private 或 public）
    // @off 太严格了
    'typescript/explicit-member-accessibility': 0,
    // 接口必须以 I 开头
    // @off 没必要限制
    'typescript/interface-name-prefix': 0,
    // 接口和类型字面量中每一行都必须以分号结尾
    'typescript/member-delimiter-style': 2,
    // 私有变量命名必须以下划线开头
    // @off 没必要限制
    'typescript/menber-naming': 0,
    // 属性和方法必须按照排序规则排序
    'typescript/member-ordering': 2,
    // 必须使用 as 进行类型断言
    // @off 没必要限制，在 React 项目中需要限制
    'typescript/no-angle-bracket-type-assertion': 0,
    // 禁止使用 Array 构造函数来初始化数组，除非指定了泛型，或传入的是单个数字
    // 开启，可以帮助发现错误
    'typescript/no-array-constructor': 2,
    // 禁止使用空接口
    // @off 没必要限制
    'typescript/no-empty-interface': 0,
    // 禁止使用 any
    // @off 太严格了
    'typescript/no-explicit-any': 0,
    // 禁止使用 namespace 和 module
    // 用 namespace 或 module 来定义模块是以前的用法，现在已经有了 import 和 export
    'typescript/no-namespace': 2,
    // 禁止在给构造函数的参数添加修饰符
    // @off 没必要限制
    'typescript/no-parameter-properties': 0,
    // 禁止使用三斜线注释
    // @off 没必要限制
    'typescript/no-triple-slash-reference': 0,
    // 限制 type 的使用
    // @off 没必要限制
    'typescript/no-type-alias': 0,
    // 定义过的变量必须使用
    // eslint 原生的 no-unused-vars 无法使用，需要使用 typescript/no-unused-vars
    'typescript/no-unused-vars': 2,
    // 变量必须先定义后使用
    // @off eslint 原生已支持 no-use-before-define
    'typescript/no-use-before-define': 0,
    // 使用 namespace 代替 module
    // @off typescirpt/no-namespace 已经禁用了 namespace 和 module
    'typescript/prefer-namespace-keyword': 0,
    // 类型定义的冒号前后是否需要空格
    // 默认冒号前必须没有空格，冒号后必须有空格
    'typescript/type-annotation-spacing': 2
  }
};