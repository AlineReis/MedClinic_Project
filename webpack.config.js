const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const webpack = require("webpack");

module.exports = (env, argv) => {
  const isProduction = argv.mode === "production";

  // Lista de páginas que seguem o padrão genérico para geração automática
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
      // Configs e Globais
      theme: "./src/config/theme.ts",
      main: "./src/index.ts",

      // Páginas de Autenticação
      login: "./src/pages/login.ts",
      register: "./src/pages/register.ts",

      // Paciente
      patientDashboard: "./src/pages/patientDashboard.ts",
      myAppointments: "./src/pages/myAppointments.ts",
      myExams: "./src/pages/myExams.ts",
      examsPage: "./src/pages/examsPage.ts",
      scheduleAppointment: "./src/pages/scheduleAppointment.ts",

      // Profissionais e Staff
      doctorDashboard: "./src/pages/doctorDashboard.ts",
      receptionDashboard: "./src/pages/receptionDashboard.ts",

      managerDashboard: "./src/pages/managerDashboard.ts",

      // Admin
      adminDashboard: "./src/pages/adminDashboard.ts",

      usersPage: "./src/pages/usersPage.ts",
      adminUsersPage: "./src/pages/adminUsersPage.ts",
      financialPage: "./src/pages/financialPage.ts",
      teamPage: "./src/pages/teamPage.ts",


      // Outros
      patients: "./src/pages/patients.ts",

      agenda: "./src/pages/agenda.ts",
      dashboard: "./src/pages/dashboard.ts",
      pep: "./src/pages/pep.ts",
    },

    output: {
      path: path.resolve(__dirname, "dist"),
      filename: "js/[name].[contenthash:8].js",
      clean: true,
      // Importante: "/" força o navegador a buscar assets na raiz,
      // evitando erros 404 quando o HTML está dentro de /pages/
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
        // Opcional: Adicionar suporte para imagens importadas no CSS/TS
        {
          test: /\.(png|svg|jpg|jpeg|gif)$/i,
          type: 'asset/resource',
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

      // --- Páginas manuais (com configurações específicas) ---
      new HtmlWebpackPlugin({
        template: "./index.html",
        filename: "index.html",
        chunks: ["theme", "main"],
      }),
      new HtmlWebpackPlugin({
        template: "./pages/schedule-appointment.html",
        filename: "pages/schedule-appointment.html",
        chunks: ["theme", "scheduleAppointment"],
        publicPath: "../",
      }),
      new HtmlWebpackPlugin({
        template: "./pages/login.html",
        filename: "pages/login.html",
        chunks: ["theme", "login"],
        publicPath: "../",
      }),
      new HtmlWebpackPlugin({
        template: "./pages/register.html",
        filename: "pages/register.html",
        chunks: ["theme", "register"],
        publicPath: "../",
      }),
      new HtmlWebpackPlugin({
        template: "./pages/my-appointments.html",
        filename: "pages/my-appointments.html",
        chunks: ["theme", "myAppointments"],
        publicPath: "../",
      }),
      new HtmlWebpackPlugin({
        template: "./pages/exams.html",
        filename: "pages/exams.html",
        chunks: ["theme", "examsPage"],
        publicPath: "../",
      }),
      new HtmlWebpackPlugin({
        template: "./pages/my-exams.html",
        filename: "pages/my-exams.html",
        chunks: ["theme", "myExams"],
        publicPath: "../",
      }),
      new HtmlWebpackPlugin({
        template: "./pages/agenda.html",
        filename: "pages/agenda.html",
        chunks: ["theme", "agenda"],
        publicPath: "../",
      }),
      new HtmlWebpackPlugin({
        template: "./pages/pep.html",
        filename: "pages/pep.html",
        chunks: ["theme", "pep"],
        publicPath: "../",
      }),

      // --- Geração automática baseada na lista mainPages ---
      ...mainPages.map((page) => {
        // Lógica para determinar qual chunk JS vai em qual HTML
        const chunks = ["theme", "main"]; // Todos recebem theme e main (opcional)

        if (page === "patient-dashboard.html") chunks.push("patientDashboard");
        if (page === "doctor-dashboard.html") chunks.push("doctorDashboard");
        if (page === "reception-dashboard.html") chunks.push("receptionDashboard");
        if (page === "admin-dashboard.html") chunks.push("adminDashboard");
        if (page === "manager-dashboard.html") chunks.push("managerDashboard");
        if (page === "financial.html") chunks.push("financialPage");
        if (page === "users.html") chunks.push("usersPage", "teamPage");
        if (page === "admin-users.html") chunks.push("adminUsersPage");
        if (page === "patients.html") chunks.push("patients");

        return new HtmlWebpackPlugin({
          template: `./pages/${page}`,
          filename: `pages/${page}`,
          chunks: chunks,
        });
      }),

new CopyWebpackPlugin({
  patterns: [
    { from: "assets", to: "assets" },
    // AQUI: Copia a pasta css inteira para dist/css
    { from: "css", to: "css" },
    { from: "manifest.json", to: "manifest.json" },
    { from: "sw.js", to: "sw.js" },
  ],
}),

    ],

    devServer: {
      static: {
        directory: path.resolve(__dirname, "dist"),
      },
      // Importante para garantir que o router de SPA (se houver) ou links funcionem
      historyApiFallback: {
        rewrites: [
           // Exemplo: se der 404 em /pages, redireciona para index (ajuste conforme necessidade)
           // { from: /^\/pages/, to: '/index.html' },
        ]
      },
      watchFiles: ["src/**/*", "css/**/*", "js/**/*", "pages/**/*"],
      open: true,
      hot: false, // Hot Module Replacement (às vezes conflita com extração de CSS puro, false é mais seguro pra começar)
    },

    target: isProduction ? "browserslist" : "web",
    resolve: {
      extensions: [".ts", ".tsx", ".js"],
    },
  };
};
