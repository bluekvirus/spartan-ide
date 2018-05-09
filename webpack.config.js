/**
 * Note that the `yarn build` cmd will run `webpack` according to the config here.
 * 
 * `yarn start` will start the server with a special browser-refresh reload supporting .marko file changes, js only;
 * `yarn watch` will run `webpack -w`, this will update the bundle.css;
 * 
 * Note that without `yarn watch`, the less/css changes in the components will not be emitted by webpack nor picked up by browser-refresh.
 *  
 */

'use strict';
const webpack = require('webpack');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
    // Add source map support
    devtool: '#cheap-source-map',
    entry: './client.js',
    output: {
        path: __dirname,
        filename: 'static/js/bundle.js'
    },
    resolve: {
        extensions: ['.js', '.marko'],
        modules: ['./', 'node_modules']
    },
    module: {
        rules: [
            {
                test: /\.marko$/,
                loader: 'marko-loader'
            },
            {
                test: /\.l?[ec]ss$/,
                use: [{
                        loader: MiniCssExtractPlugin.loader 
                        // 'style-loader' // creates style nodes from JS strings
                    }, {
                        loader: 'css-loader' // translates CSS into CommonJS
                    }, {
                        loader: 'less-loader' // compiles Less to CSS
                }]
            },
            {
                test: /\.svg/,
                loader: 'svg-url-loader'
            },
            {
                test: /\.(jpg|jpeg|gif|png)$/,
                loader: 'file-loader',
                query: {
                    name: 'static/img/[hash].[ext]',
                    publicPath: '/'
                }
            }
        ]
    },
    plugins: [
            // Avoid publishing files when compilation failed:
            new webpack.NoEmitOnErrorsPlugin(),

            // Write out CSS bundle to its own file:
            new MiniCssExtractPlugin({
                filename: 'static/css/bundle.css'
            })
    ],
    optimization: {
        splitChunks: {
            cacheGroups: {
                styles: {
                    name: 'styles',
                    test: /\.css$/,
                    chunks: 'all',
                    enforce: true
                }
            }
        }
    }
};
