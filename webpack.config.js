const path = require('path');
const nodeExternals = require('webpack-node-externals');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const ExtractTextPlugin = require("extract-text-webpack-plugin");
const webpack = require("webpack");

module.exports = [{
    entry: [
        'babel-polyfill',
        path.join(__dirname, 'client.jsx')
    ],
    output: {
        filename: 'client.bundle.js',
        path: path.join(__dirname, 'dist')
    },
    cache: true,
    resolve: {
        extensions: ['.js', '.jsx', 'map']
    },
    module: {
        rules: [
            {
                test: /\.jsx?$/,
                exclude: /node_modules/,
                use: [{
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
                use: ExtractTextPlugin.extract({
                    fallback: "style-loader",
                    use: ["css-loader", "less-loader"]
                })
            }
        ]
    },
    plugins: [
        new webpack.DefinePlugin({
            'process.env.NODE_ENV': JSON.stringify('production')
        }),
        new UglifyJsPlugin(),
        new ExtractTextPlugin("style.bundle.css"),
    ]
}, {
    entry: path.join(__dirname, 'server.js'),
    output: {
        filename: 'server.bundle.js',
        path: path.join(__dirname, 'dist')
    },
    cache: true,
    target: "node",
    externals: [nodeExternals()],
    resolve: {
        extensions: ['.js', '.jsx', 'map'],
        modules: [path.join(__dirname, 'node_modules')]
    },
    module: {
        rules: [
            {
                test: /\.jsx?$/,
                exclude: /node_modules/,
                use: [{
                    loader: 'babel-loader',
                    options: {
                        presets: [
                            "react",
                            ["env", {targets: {node: "current"}}]
                        ]
                    }
                }]
            }, {
                test: /\.json?$/,
                loader: 'json-loader'
            }, {
                test: /\.handlebars$/,
                loader: "handlebars-loader"
            }
        ]
    },
    plugins: [
        new webpack.DefinePlugin({
            'process.env.NODE_ENV': JSON.stringify('production')
        }),
    ],
}];
