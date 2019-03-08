# ts-rootdirs-webpack-plugin

Resolve tsconfig.compilerOptions.rootDirs.

# Usage

## Install

```
npm i -D ts-rootdirs-webpack-plugin
```

## Config

```js
// webpack.config.js
const webpackplugin = new (require('ts-rootdirs-webpack-plugin')).default();

module.exports = {
  ...
  resolve: {
    plugins: [webpackplugin]
  }
}
```

# Example

```json
// tsconfig.json
{
  "compilerOptions": {
    ...
   "rootDirs": ["locale/zh", "locale/a/b/c/#{locale}"],
    ...
  }
}
```

```js
import locale from '../../locale/a/b/c/#{locale}/message.json';
   ||
   ▽
const message_json_1 = __importDefault(__webpack_require__(/*! ../../locale/zh/message.json */ "./locale/zh/message.json"));
```
