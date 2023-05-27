module.exports = {
  plugins: {
    autoprefixer: {
      // overrideBrowserslist: [
      //   "Android 4.1",
      //   "iOS 7.1",
      //   "Chrome > 31",
      //   "ff > 31",
      //   "ie >= 8",
      //   "last 10 versions"
      // ],
      grid: true
    },
    'postcss-pxtorem': {
      rootValue: 16,
      propList: ['*'],
      unitPrecision: 5 
    }
  }
}