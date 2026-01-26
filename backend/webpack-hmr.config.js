const nodeExternals = require('webpack-node-externals');
const { RunScriptWebpackPlugin } = require('run-script-webpack-plugin');

module.exports = function (options, webpack) {
  return {
    ...options,
    mode: 'development',
    entry: ['webpack/hot/poll?100', options.entry],
    watchOptions: {
      poll: 100,
      aggregateTimeout: 300,
      ignored: /node_modules/,
    },
    devtool: 'source-map',
    externals: [
      nodeExternals({
        allowlist: ['webpack/hot/poll?100'],
      }),
    ],
    plugins: [
      ...options.plugins,
      new webpack.HotModuleReplacementPlugin({
        multiStep: false,
        fullBuildTimeout: 200,
        requestTimeout: 10000,
      }),
      new webpack.WatchIgnorePlugin({
        paths: [/\.js$/, /\.d\.ts$/, /node_modules/, /dist/],
      }),
      new RunScriptWebpackPlugin({
        name: options.output.filename,
        autoRestart: true,
        onBuildEnd: ['echo "Webpack built successfully"'],
      }),
    ],
  };
};
