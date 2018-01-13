const path = require('path')
const webpack = require('webpack')

module.exports = {
    entry: [
        'babel-polyfill',
        'webpack-hot-middleware/client',
        'webpack/hot/dev-server',
        path.join(__dirname, 'client.jsx')
    ],
    devtool: 'source-map',
    target: 'web',
    output: {
        filename: 'client.bundle.js',
        path: '/',
        publicPath: 'http://localhost:3000/'
    },
    cache: true,
    resolve: {
        extensions: ['.jsx', '.js', 'map']
    },
    module: {
        rules: [
            {
                test: /\.jsx?$/,
                exclude: /node_modules/,
                use: [{
                    loader: 'react-hot-loader'
                }, {
                    loader: 'babel-loader',
                    options: {
                        presets: ["react", "env"]
                    }
                }]
            }, {
                test: /\.json?$/,
                loader: 'json-loader'
            }, {
                test: /\.less$/,
                use: [{
                    loader: "style-loader" // creates style nodes from JS strings
                }, {
                    loader: "css-loader" // translates CSS into CommonJS
                }, {
                    loader: "less-loader" // compiles Less to CSS
                }]
            }
        ]
    },
    plugins: [
        new webpack.HotModuleReplacementPlugin(),
        new webpack.NamedModulesPlugin(),
        new webpack.NoEmitOnErrorsPlugin(),
        new webpack.DefinePlugin({
            'process.env.NODE_ENV': JSON.stringify('development'),
        })
    ]
};
