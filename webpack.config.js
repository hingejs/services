const { resolve } = require('path')
module.exports = {
  entry: {
    index: './index.js',
  },
  output: {
    filename: '[name].min.js',
    path: resolve(__dirname, 'dist')
  },
  resolve: { extensions: ['.js'] },
  watch: false
}
