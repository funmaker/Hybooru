import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import path from 'path';

const root = process.cwd();

// noinspection JSUnusedGlobalSymbols
export default {
	mode: 'development',
	target: 'web',
	context: root,
	entry: [
		'@babel/polyfill',
		'./client.jsx',
	],
	resolve: {
		extensions: ['.js', '.jsx', '.css', '.scss'],
		modules: [root, 'node_modules'],
	},
	output: {
		path: path.join(root, 'dist'),
		filename: 'client.js',
	},
	plugins: [
		new MiniCssExtractPlugin({
			filename: "style.css",
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
								browsers: "last 2 versions",
							},
						}],
						"@babel/preset-react",
					],
					plugins: [
						"@babel/plugin-proposal-object-rest-spread",
						"@babel/plugin-proposal-class-properties",
					],
				},
			}, {
				test: /\.scss$/,
				use: [
					MiniCssExtractPlugin.loader,
					"css-loader",
					"sass-loader",
				],
			}, {
				test: /\.css$/,
				use: [
					MiniCssExtractPlugin.loader,
					"css-loader",
				],
			},
		],
	},
};