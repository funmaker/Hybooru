const path = require('path')
const webpack = require('webpack')

module.exports = {
    entry: [
        'react-hot-loader/patch',
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
        publicPath: '/'
    },
    mode: "development",
    cache: true,
    resolve: {
        extensions: ['.jsx', '.js', 'map']
    },
    module: {
        rules: [
            {
                test: /\.jsx?$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: [
                            ['env', {modules: false}],
                            'react',
                        ],
                        plugins: [
                            'react-hot-loader/babel',
                            'transform-object-rest-spread'
                        ]
                    }
                }
            }, {
                test: /\.json?$/,
                loader: 'json-loader'
            }, {
                test: /\.scss$/,
                use: [{
                    loader: "style-loader" // creates style nodes from JS strings
                }, {
                    loader: "css-loader" // translates CSS into CommonJS
                }, {
                    loader: "sass-loader" // compiles Less to CSS
                }]
            }, {
                test: /\.css$/,
                use: [
                    'style-loader',
                    'css-loader'
                ]
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
