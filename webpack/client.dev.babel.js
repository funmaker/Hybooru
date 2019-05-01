import webpack from 'webpack';

const root = process.cwd();

// noinspection JSUnusedGlobalSymbols
export default {
	mode: 'development',
	target: 'web',
	context: root,
	devtool: 'source-map',
	entry: [
		'@babel/polyfill',
		'webpack-hot-middleware/client',
		'./client.jsx',
	],
	resolve: {
		extensions: ['.js', '.jsx', '.css', '.scss'],
		modules: [root, 'node_modules'],
		alias: {
			"react-dom": '@hot-loader/react-dom'
		},
	},
	output: {
		publicPath: '/',
		filename: 'client.js',
		devtoolModuleFilenameTemplate: "[absolute-resource-path]",
	},
	plugins: [
		new webpack.HotModuleReplacementPlugin(),
		new webpack.NamedModulesPlugin(),
		new webpack.NoEmitOnErrorsPlugin(),
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
								browsers: "last 2 versions",
							},
						}],
						["@babel/preset-react", {
							development: true,
						}],
					],
					plugins: [
						'react-hot-loader/babel',
						"@babel/plugin-proposal-object-rest-spread",
						"@babel/plugin-proposal-class-properties",
					],
				},
			}, {
				test: /\.scss$/,
				use: [
					"style-loader",
					"css-loader",
					"sass-loader",
				],
			}, {
				test: /\.css$/,
				use: [
					'style-loader',
					'css-loader',
				],
			},
		],
	},
};