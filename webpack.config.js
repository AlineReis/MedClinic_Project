const path = require("path")
const HtmlWebpackPlugin = require("html-webpack-plugin")
const MiniCssExtractPlugin = require("mini-css-extract-plugin")
const CopyWebpackPlugin = require("copy-webpack-plugin")

module.exports = (env, argv) => {
  const isProduction = argv.mode === "production"

  return {
    entry: {
      main: "./src/index.ts",
      login: "./src/pages/login.ts",
      patient_dashboard: "./src/pages/patient-dashboard.ts",
      register: "./src/pages/register.ts",
    },
    output: {
      path: path.resolve(__dirname, "dist"),
      filename: "js/[name].[contenthash:8].js",
      clean: true,
      publicPath: "/",
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
        chunks: ["main"],
      }),
      new HtmlWebpackPlugin({
        template: "./pages/login.html",
        filename: "pages/login.html",
        chunks: ["login"],
        publicPath: "/",
      }),
      new HtmlWebpackPlugin({
        template: "./pages/patient-dashboard.html",
        filename: "pages/patient-dashboard.html",
        chunks: ["patient_dashboard"], // Load specific bundle
        publicPath: "/",
      }),
      new HtmlWebpackPlugin({
        template: "./pages/register.html",
        filename: "pages/register.html",
        chunks: ["register"],
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
              ignore: ["**/login.html", "**/patient-dashboard.html", "**/register.html"],
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
