const ErrorLoggerPlugin = require('error-logger-webpack-plugin');
const ExtractTextPlugin = require("extract-text-webpack-plugin");
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

const path = require('path');

const isProd = process.env.NODE_ENV === 'production';

module.exports = {
    context: path.join(__dirname, '/src/main/resources/assets'),
    entry: {
        home: './js/home/main.js',
        launcher: './js/launcher/main.js'
    },
    output: {
        path: path.join(__dirname, '/build/resources/main/assets/'),
        filename: './js/[name]/bundle.js'
    },
    module: {
        rules: [
            {
                test: /\.less$/,
                use: ExtractTextPlugin.extract({
                    fallback: 'style-loader',
                    use: [
                        { loader: 'postcss-loader', options: { sourceMap: !isProd, config: { path: 'postcss.config.js' } } },
                        { loader: 'less-loader', options: { sourceMap: !isProd } }
                    ]
                })
            },
            {
                test: /\.(png|jpg|gif)$/,
                loader: 'file-loader?name=./icons/favicons/[name].[ext]'
            }
        ]
    },
    plugins: [
        new ErrorLoggerPlugin(),
        new ExtractTextPlugin({
            filename: './styles/[name].css',
            allChunks: true,
            disable: false
        }),
        ...(isProd ? [
            new UglifyJsPlugin({
                cache: true,
                parallel: true,
                uglifyOptions: {
                    mangle: false,
                    keep_classnames: true,
                    keep_fnames: true
                }
            })
        ] : [])
    ],
    devtool: isProd ? false : 'source-map'
};
