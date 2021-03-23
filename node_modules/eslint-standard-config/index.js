const path = require('path');

module.exports = (obj) => {
  let config = obj || {};
  let {typescript, react} = config;
  config.extends = [path.resolve(__dirname, './react.js')];
  // if (typescript && react) {
  //   config.extends = [path.resolve(__dirname, './typescript-react.js')];
  // } else if (typescript) {
  //   config.extends = [path.resolve(__dirname, './typescript.js')];
  // } else if (react) {
  //   config.extends = [path.resolve(__dirname, './react.js')];
  // } else {
  //   config.extends = [path.resolve(__dirname, './javascript.js')];
  // }
  return config;
};
