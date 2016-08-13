// $ webpack

var webpack = require("webpack");

module.exports = {
	entry: './src/slashCanvas2/App.js',
	output: {
		path: './dest/',
		filename: 'SlashCanvas2.js',
		library: 'SlashCanvas2',
		libraryTarget: 'umd'
	},
	module: {
		loaders: [
			// { test: /\.html$/, loader: 'html' }
		]
	},
	//devtool: 'source-map',
	resolve : {
		root : "./src/",
		alias : {
			jquery : "lib/jquery-2.1.3.min",
			matter : "lib/matter",
			decomp : "lib/decomp"
		}
	},
	plugins: [
		new webpack.optimize.UglifyJsPlugin({
			compress: { warnings: false }
		}),
	]
};
