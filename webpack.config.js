module.exports = {
	entry: "./main.tsx",   			// Root react component
	output: {
		path: './',
		filename: "bundle.js"	             // Where to put transpiled components (aka index.js)
	},
	devtool: 'source-map',
	devServer: {
		inline: true,                                     // Reload on the fly
		port: 3333                                       // any
	},
	resolve: {
	// Add resolvable extensions to avoid typing extensions in imports.
	extensions: ['', '.webpack.js', '.web.js', '.ts', '.tsx', '.js', '.scss']
	},
	module: {
		loaders: [				// What to do with code passed in (starting at main.tsx)
		
			{
				test: /\.ts(x?)$/,
				exclude: /node_modules/,               // Don't process anything in modules
				loader: 'ts-loader'
			},
			
			{
				test: /\.scss$/,
				loader: 'style-loader!css-loader!sass-loader'	// Chains right to left
			},
			
			{
				test: /\.png$/,
				loader: 'url-loader?limit=8192'
			}

		]
	}
}