const path = require("path");

module.exports = {
  mode: "production",
  entry: path.resolve(__dirname, "./src/index.ts"),
  module: {
    rules: [
      {
        test: /\.ts?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
      {
        test: /\.m?js$/,
        resolve: {
          fullySpecified: false,
        },
      },
    ],
  },
  resolve: {
    extensions: [".ts", ".js"],
    fallback: {
      dgram: false,
      os: false,
      net: false,
      path: false,
    },
  },
  output: {
    filename: "script.js",
    path: path.resolve(__dirname, "public", "static", "bundle"),
    publicPath: "/static/bundle/",
  },
  performance: {
    hints: false,
    maxEntrypointSize: 512000,
    maxAssetSize: 512000,
  },
};
