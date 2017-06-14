var path = require("path"),
    webpack = require("webpack"),
    pkg = require("./package.json");

module.exports = {
  entry: {
    "xfc": ["babel-polyfill", "./src"],
  },
  output: {
    filename: "xfc.js",
    libraryTarget: 'umd',
    library: 'XFC'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        include: path.resolve(__dirname, 'src'),
        use: [
          {
            loader: 'babel-loader',
            options: {
              presets: ["es2015"],
            }
          }
        ]
      }
    ]
  },
  devServer: {
    disableHostCheck: true
  },
  devtool: "cheap-eval-source-map"
};
