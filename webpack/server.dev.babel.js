import webpack from 'webpack';
import path from 'path';
import nodeExternals from 'webpack-node-externals';
import StartServerPlugin from 'start-server-webpack-plugin';

const root = process.cwd();

// noinspection JSUnusedGlobalSymbols
export default {
	mode: 'development',
	target: 'async-node',
	context: root,
	watch: true,
	devtool: 'source-map',
	externals: [nodeExternals({
		whitelist: ['webpack/hot/signal'],
	})],
	entry: [
		'webpack/hot/signal',
		'./server.js',
	],
	resolve: {
		extensions: ['.js', '.jsx'],
		modules: [root, 'node_modules'],
		alias: {
			"react-dom": '@hot-loader/react-dom'
		},
	},
	output: {
		path: path.join(root, 'build'),
		filename: 'server.js',
		devtoolModuleFilenameTemplate: "[absolute-resource-path]",
	},
	node: {
		__filename: true,
		__dirname: true,
	},
	plugins: [
		new webpack.HotModuleReplacementPlugin(),
		new webpack.NamedModulesPlugin(),
		new webpack.NoEmitOnErrorsPlugin(),
		new StartServerPlugin({
			name: 'server.js',
			signal: true,
		}),
	],
	module: {
		rules: [
			{
				test: /\.js$|\.jsx$/,
				exclude: /(node_modules)/,
				loader: 'babel-loader',
				options: {
					presets: [
						["@babel/preset-env", {
							targets: {
								node: "current",
							},
						}],
						["@babel/preset-react", {
							development: true,
						}],
					],
					plugins: [
						"@babel/plugin-proposal-object-rest-spread",
					],
				},
			}, {
				test: /\.handlebars$/,
				loader: 'handlebars-loader',
			},
		],
	},
};