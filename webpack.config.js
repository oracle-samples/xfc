const path = require('path');

module.exports = {
  entry: {
    xfc: ['./src'],
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
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
  devtool: 'source-map',
};
