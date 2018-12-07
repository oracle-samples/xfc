const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

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
  optimization: {
    minimizer: [
      new TerserPlugin({
        cache: true,
        parallel: true,
        sourceMap: true,
        terserOptions: {
          compress: {
            typeofs: false,
          },
        },
      }),
    ],
  },
};
