var path = require("path"),
    webpack = require("webpack"),
    pkg = require("./package.json");

module.exports = {
  entry: {
    "xfc": ["./src"],
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
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
  devtool: "source-map",
  plugins: [
    new webpack.optimize.UglifyJsPlugin({
      sourceMap: true
    }),
    new webpack.LoaderOptionsPlugin({
      minimize: true
    })
  ]
};
