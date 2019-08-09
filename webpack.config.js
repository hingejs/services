const { resolve } = require('path')

module.exports = {
  entry: {
    index: './index.js',
    // vendor: Object.keys(package.dependencies)
  },
  output: {
    filename: '[name].js',
    path: resolve(__dirname, 'dist')
  },
  resolve: { extensions: ['.js'] },
  watch: false
}
