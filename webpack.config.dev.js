const path = require('path');

module.exports = {
  entry: {
    xfc: ['./src'],
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
  devtool: 'source-map',
};
