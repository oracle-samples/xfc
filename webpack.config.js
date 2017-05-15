var path = require("path"),
    webpack = require("webpack"),
    pkg = require("./package.json");

module.exports = {
  entry: {
    "xfc": ["./src"],
  },
  output: {
    path: "./dist/",
    filename: "xfc.js",
    libraryTarget: 'umd',
    library: 'XFC'
  },
  module: {
    loaders: [
      {
        test: /\.js$/,
        include: /src|index\.js/,
        loader: 'babel-loader',
        query: {
          presets: ["es2015"],
        }
      }
    ]
  },
  devtool: "sourcemap",
  plugins: [
    new webpack.optimize.DedupePlugin({
      'process.env.NODE_ENV': JSON.stringify('production')
    }),
    new webpack.optimize.UglifyJsPlugin()
  ]
};
