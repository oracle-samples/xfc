const path = require('path');
const webpack = require('webpack');
const pkg = require('./package.json');

module.exports = {
  entry: {
    xfc: ['babel-polyfill', './src'],
  },
  output: {
    filename: 'xfc.js',
    libraryTarget: 'umd',
    library: 'XFC',
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        include: path.resolve(__dirname, 'src'),
        use: [
          {
            loader: 'babel-loader',
          },
        ],
      },
    ],
  },
  devServer: {
    host: '0.0.0.0',
    disableHostCheck: true,
  },
  devtool: 'cheap-eval-source-map',
};
