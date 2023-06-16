const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
// const { sentryWebpackPlugin } = require("@sentry/webpack-plugin");

module.exports = {
  entry: "./src/index.js",
  output: {
    filename: "main.js",
    path: path.resolve(__dirname, "build"),
  },
//   devtool: "source-map",
  plugins: [
    new HtmlWebpackPlugin({
      template: path.join(__dirname, "public", "index.html"),
    }),
    // sentryWebpackPlugin({
    //     org: "<your org>",
    //     project: "<your project>",

    //     // Auth tokens can be obtained from https://sentry.io/settings/account/api/auth-tokens/
    //     // and need `project:releases` and `org:read` scopes
    //     authToken: process.env.SENTRY_AUTH_TOKEN,
    //   }),
  ],
  devServer: {
    static: {
      directory: path.join(__dirname, "build"),
    },
    port: 3000,
  },
  module: {
    // exclude node_modules
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: ["babel-loader"],
      },
      // "url" loader works like "file" loader except that it embeds assets
      // smaller than specified limit in bytes as data URLs to avoid requests.
      // A missing `test` is equivalent to a match.
      {
        test: [/\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/],
        type: "asset",
        parser: {
          dataUrlCondition: {
            // maxSize: 10000,
          },
        },
      },
      {
        test: /\.(css)$/,
        use: ["style-loader", "css-loader"],
      },
    ],
  },
  // pass all js files through Babel
  resolve: {
    extensions: ["*", ".js", ".jsx"],
  },
};
