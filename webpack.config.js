const { resolve } = require('path')

module.exports = {
  entry: {
    index: './index.js',
    // vendor: Object.keys(package.dependencies)
  },
  output: {
    filename: '[name].min.js',
    path: resolve(__dirname)
  },
  resolve: { extensions: ['.js'] },
  watch: false
}
