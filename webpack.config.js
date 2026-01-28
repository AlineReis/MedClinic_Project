const path = require("path")
const HtmlWebpackPlugin = require("html-webpack-plugin")
const MiniCssExtractPlugin = require("mini-css-extract-plugin")
const CopyWebpackPlugin = require("copy-webpack-plugin")

module.exports = (env, argv) => {
  const isProduction = argv.mode === "production"

  return {
    entry: "./src/index.ts",
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
      new MiniCssExtractPlugin({
        filename: "css/[name].[contenthash:8].css",
      }),
      new HtmlWebpackPlugin({
        template: "./index.html",
        filename: "index.html",
      }),
      new CopyWebpackPlugin({
        patterns: [
          {
            from: "assets",
            to: "assets",
          },
        ],
      }),
    ],
    devServer: {
      static: "./dist",
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
