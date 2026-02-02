const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const webpack = require("webpack");

module.exports = (env, argv) => {
  const isProduction = argv.mode === "production";
  const mainPages = [
    "patient-dashboard.html",
    "reception-dashboard.html",
    "doctor-dashboard.html",
    "manager-dashboard.html",
    "admin-dashboard.html",
    "users.html",
    "financial.html",
    "admin-users.html",
    "patients.html",
  ];

  return {
    entry: {
      theme: "./src/config/theme.ts",
      main: "./src/index.ts",
      login: "./src/pages/login.ts",
      register: "./src/pages/register.ts",
      patients: "./src/pages/patients.ts",
      patientDashboard: "./src/pages/patientDashboard.ts",
      myAppointments: "./src/pages/myAppointments.ts",
      myExams: "./src/pages/myExams.ts",
      examsPage: "./src/pages/examsPage.ts",
      scheduleAppointment: "./src/pages/scheduleAppointment.ts",
      doctorDashboard: "./src/pages/doctorDashboard.ts",
      receptionDashboard: "./src/pages/receptionDashboard.ts",
      adminDashboard: "./src/pages/adminDashboard.ts",
      managerDashboard: "./src/pages/managerDashboard.ts",
      usersPage: "./src/pages/usersPage.ts",
      agenda: "./src/pages/agenda.ts",
      dashboard: "./src/pages/dashboard.ts",
      pep: "./src/pages/pep.ts",
      theme: "./src/config/theme.ts",
      main: "./src/index.ts",
      login: "./src/pages/login.ts",
      register: "./src/pages/register.ts",
      patientDashboard: "./src/pages/patientDashboard.ts",
      myAppointments: "./src/pages/myAppointments.ts",
      myExams: "./src/pages/myExams.ts",
      examsPage: "./src/pages/examsPage.ts",
      scheduleAppointment: "./src/pages/scheduleAppointment.ts",
      doctorDashboard: "./src/pages/doctorDashboard.ts",
      receptionDashboard: "./src/pages/receptionDashboard.ts",
      adminDashboard: "./src/pages/adminDashboard.ts",
      usersPage: "./src/pages/usersPage.ts",
      adminUsersPage: "./src/pages/adminUsersPage.ts", // New separated entry
      patients: "./src/pages/patients.ts",
      managerDashboard: "./src/pages/managerDashboard.ts",
      financialPage: "./src/pages/financialPage.ts",
      teamPage: "./src/pages/teamPage.ts",
      agenda: "./src/pages/agenda.ts",
      pep: "./src/pages/pep.ts",
    },
    output: {
      path: path.resolve(__dirname, "dist"),
      filename: "js/[name].[contenthash:8].js",
      clean: true,
      publicPath: "auto",
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
        CLINIC_API_HOST: process.env.CLINIC_API_HOST
          ? JSON.stringify(process.env.CLINIC_API_HOST)
          : "undefined",
      }),
      new MiniCssExtractPlugin({
        filename: "css/[name].[contenthash:8].css",
      }),
      new HtmlWebpackPlugin({
        template: "./index.html",
        filename: "index.html",
        chunks: ["theme", "main"],
      }),
      new HtmlWebpackPlugin({
        template: "./pages/schedule-appointment.html",
        filename: "pages/schedule-appointment.html",
        chunks: ["theme", "scheduleAppointment"],
        publicPath: "/",
      }),
      new HtmlWebpackPlugin({
        template: "./pages/login.html",
        filename: "pages/login.html",
        chunks: ["theme", "login"],
        publicPath: "/",
      }),
      new HtmlWebpackPlugin({
        template: "./pages/register.html",
        filename: "pages/register.html",
        chunks: ["theme", "register"],
        publicPath: "/",
      }),
      new HtmlWebpackPlugin({
        template: "./pages/my-appointments.html",
        filename: "pages/my-appointments.html",
        chunks: ["theme", "myAppointments"],
        publicPath: "/",
      }),
      new HtmlWebpackPlugin({
        template: "./pages/exams.html",
        filename: "pages/exams.html",
        chunks: ["theme", "examsPage"],
        publicPath: "/",
      }),
      new HtmlWebpackPlugin({
        template: "./pages/my-exams.html",
        filename: "pages/my-exams.html",
        chunks: ["theme", "myExams"],
        publicPath: "/",
      }),

      new HtmlWebpackPlugin({
        template: "./pages/agenda.html",
        filename: "pages/agenda.html",
        chunks: ["theme", "agenda"],
        publicPath: "/",
      }),

      new HtmlWebpackPlugin({
        template: "./pages/pep.html",
        filename: "pages/pep.html",
        chunks: ["theme", "pep"],
        publicPath: "/",
      }),
      ...mainPages.map(
        (page) =>
          new HtmlWebpackPlugin({
            template: `./pages/${page}`,
            filename: `pages/${page}`,
            chunks: [
              "theme",
              "main",
              ...(page === "patient-dashboard.html"
                ? ["patientDashboard"]
                : []),
              ...(page === "doctor-dashboard.html" ? ["doctorDashboard"] : []),
              ...(page === "reception-dashboard.html"
                ? ["receptionDashboard"]
                : []),
              ...(page === "admin-dashboard.html" ? ["adminDashboard"] : []),
              ...(page === "manager-dashboard.html"
                ? ["managerDashboard"]
                : []),
              ...(page === "users.html" ? ["usersPage"] : []),
              ...(page === "manager-dashboard.html"
                ? ["managerDashboard"]
                : []),
              ...(page === "financial.html" ? ["financialPage"] : []),
              ...(page === "users.html" ? ["usersPage", "teamPage"] : []),
              ...(page === "admin-users.html" ? ["adminUsersPage"] : []),
              ...(page === "patients.html" ? ["patients"] : []),
            ],
            publicPath: "/",
          }),
      ),
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
              ignore: [
                "**/patients.html",
                "**/login.html",
                "**/schedule-appointment.html",
                "**/my-appointments.html",
                "**/my-exams.html",
                "**/exams.html",
                "**/patient-dashboard.html",
                "**/register.html",
                "**/doctor-dashboard.html",
                "**/reception-dashboard.html",
                "**/admin-dashboard.html",
                "**/users.html",
                "**/agenda.html",
                "**/dashboard.html",
                "**/pep.html",
                ...mainPages.map((page) => `**/${page}`),
              ],
            },
          },
          {
            from: "manifest.json",
            to: "manifest.json",
          },
          {
            from: "css",
            to: "css",
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
  };
};
