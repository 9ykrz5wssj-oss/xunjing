const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
  mode: "production",
  entry: "./index.web.ts",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "bundle.[contenthash:8].js",
    publicPath: "/",
    clean: true,
  },
  resolve: {
    extensions: [".web.ts", ".web.tsx", ".ts", ".tsx", ".js", ".jsx"],
    alias: {
      "react-native$": "react-native-web",
    },
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        use: {
          loader: "ts-loader",
          options: { transpileOnly: true },
        },
        exclude: /node_modules\/(?!@react-native|react-native-|expo-|@expo)/,
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"],
      },
      {
        test: /\.(png|jpe?g|gif|svg|webp)$/,
        type: "asset/resource",
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "./web/index.html",
      filename: "index.html",
    }),
  ],
  devServer: {
    historyApiFallback: true,
    port: 19006,
  },
};
