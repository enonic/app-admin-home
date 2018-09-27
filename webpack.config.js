const ErrorLoggerPlugin = require('error-logger-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const CircularDependencyPlugin = require('circular-dependency-plugin');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

const path = require('path');

const isProd = process.env.NODE_ENV === 'production';

module.exports = {
    context: path.join(__dirname, '/src/main/resources/assets'),
    entry: {
        'js/home/bundle': './js/home/main.ts',
        'js/launcher/bundle': './js/launcher/main.ts',
        'styles/home': './styles/home.less',
        'styles/launcher': './styles/launcher.less',
    },
    output: {
        path: path.join(__dirname, '/build/resources/main/assets'),
        filename: './[name].js'
    },
    resolve: {
        extensions: ['.ts', '.js', '.less', '.css']
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: [{loader: 'ts-loader', options: {configFile: 'tsconfig.build.json'}}]
            },
            {
                test: /\.less$/,
                use: ExtractTextPlugin.extract({
                    fallback: 'style-loader',
                    publicPath: '../../',
                    use: [
                        {loader: 'postcss-loader', options: {sourceMap: !isProd}},
                        {loader: 'less-loader', options: {sourceMap: !isProd}}
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
            filename: '[name].css',
            allChunks: true,
            disable: false
        }),
        new CircularDependencyPlugin({
            exclude: /a\.js|node_modules/,
            failOnError: true
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
