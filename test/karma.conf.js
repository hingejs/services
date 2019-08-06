// Karma configuration file, see link for more information
// https://karma-runner.github.io/1.0/config/configuration-file.html
const path = require('path')

module.exports = function (config) {
  config.set({
    autoWatch: false,
    basePath: '',
    browsers: ['ChromeHeadless'],
    colors: true,
    concurrency: Infinity,
    coverageIstanbulReporter: {
      combineBrowserReports: true,
      dir : 'test/coverage/',
      fixWebpackSourcePaths: true,
      reports: ['html', 'lcovonly', 'text-summary'],
      skipFilesWithNoCoverage: false
    },
    files: [
      { included: true, pattern: 'services/index.spec.js', type: 'module' },
    ],
    frameworks: ['chai', 'mocha', 'sinon'],
    logLevel: config.LOG_INFO,
    plugins: [
      require('karma-chai'),
      require('karma-chrome-launcher'),
      require('karma-coverage-istanbul-reporter'),
      require('karma-mocha'),
      require('karma-sinon'),
      require('karma-webpack'),
    ],
    port: 9876,
    preprocessors: {
      'services/index.spec.js': ['webpack'],
    },
    reporters: ['progress', 'coverage-istanbul'],
    singleRun: true,
    webpack: {
      mode: 'development',
      module: {
        rules: [
          {
            enforce: 'post',
            exclude: /(node_modules|index\.js|\.spec\.js)$/,
            include: path.resolve('lib/'),
            test: /\.js$/,
            use: {
              loader: 'istanbul-instrumenter-loader',
              options: { esModules: true }
            },
          }
        ]
      },
    },
    webpackMiddleware: {
      noInfo: true
    }
  })
}
