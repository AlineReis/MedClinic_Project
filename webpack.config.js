const path = require("path")
const HtmlWebpackPlugin = require("html-webpack-plugin")
const MiniCssExtractPlugin = require("mini-css-extract-plugin")
const CopyWebpackPlugin = require("copy-webpack-plugin")
const webpack = require("webpack")

module.exports = (env, argv) => {
  const isProduction = argv.mode === "production"

  return {
    entry: {
      main: "./src/index.ts",
      login: "./src/pages/login.ts",
    },
    output: {
      path: path.resolve(__dirname, "dist"),
      filename: "js/[name].[contenthash:8].js",
      clean: true,
      publicPath: "",
    },
    module: {
      rules: [
        {
          test: /\.css$/i,
          use: [MiniCssExtractPlugin.loader, "css-loader"],
        },
        {
          test: /\.tsx?$/,
          use: "ts-loader",
          exclude: /node_modules/,
        },
      ],
    },
    plugins: [
      new webpack.DefinePlugin({
        CLINIC_API_HOST: JSON.stringify(
          process.env.CLINIC_API_HOST ??
            "http://localhost:3000/api/v1/clinic-01",
        ),
      }),
      new MiniCssExtractPlugin({
        filename: "css/[name].[contenthash:8].css",
      }),
      new HtmlWebpackPlugin({
        template: "./index.html",
        filename: "index.html",
        chunks: ["main"],
      }),
      new HtmlWebpackPlugin({
        template: "./pages/login.html",
        filename: "pages/login.html",
        chunks: ["login"],
        publicPath: "/",
      }),
      new CopyWebpackPlugin({
        patterns: [
          {
            from: "assets",
            to: "assets",
          },
          {
            from: "pages",
            to: "pages",
            globOptions: {
              ignore: ["**/login.html"],
            },
          },
          {
            from: "manifest.json",
            to: "manifest.json",
          },
          {
            from: "css/global.css",
            to: "css/global.css",
          },
          {
            from: "sw.js",
            to: "sw.js",
          },
        ],
      }),
    ],
    devServer: {
      static: {
        directory: path.resolve(__dirname, "dist"),
      },
      watchFiles: ["src/**/*", "css/**/*", "js/**/*", "pages/**/*"],
      open: true,
      hot: false,
    },
    target: isProduction ? "browserslist" : "web",
    resolve: {
      extensions: [".ts", ".tsx", ".js"],
    },
  }
}
