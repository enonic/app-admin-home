const ErrorLoggerPlugin = require('error-logger-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const workboxPlugin = require('workbox-webpack-plugin');
const path = require('path');

const paths = {
    assets: 'src/main/resources/assets/',
    buildAssets: 'build/resources/main/assets/',
    buildPwaLib: 'build/resources/main/js/pwa/'
};

const assetsPath = path.join(__dirname, paths.assets);
const buildAssetsPath = path.join(__dirname, paths.buildAssets);
const buildPwaLibPath = path.join(__dirname, paths.buildPwaLib);


module.exports = {
    context: `${__dirname}/src/main/resources/assets`,
    entry: {
        home: './js/home/main.js',
        launcher: './js/launcher/main.js'
    },
    output: {
        path: `${__dirname}/build/resources/main/assets/`,
        filename: './js/[name]/bundle.js'
    },
    module: {
        rules: [
            {
                test: /\.less$/,
                use: ExtractTextPlugin.extract({
                    fallback: 'style-loader',
                    use: [
                        { loader: 'css-loader', options: { sourceMap: true, importLoaders: 1 } },
                        { loader: 'postcss-loader', options: { sourceMap: true, config: { path: 'postcss.config.js' } } },
                        { loader: 'less-loader', options: { sourceMap: true } }
                    ]
                })
            },
            {
                test: /\.(woff|woff2|eot|ttf|svg)$/,
                loader: 'file-loader?name=../fonts/[name].[ext]'
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
        new workboxPlugin({
            globDirectory: buildAssetsPath,
            globPatterns: [
                'icons/*',
                'images/*',
                '**\/bundle.*',
                '**\/*.css'
            ],
            globIgnores: [],
            swSrc: path.join(assetsPath, 'js/pwa/sw-dev.js'),
            swDest: path.join(buildPwaLibPath, 'sw-template.js')
        })
    ],
    devtool: 'source-map'
};
