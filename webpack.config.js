const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CircularDependencyPlugin = require('circular-dependency-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const ImageMinimizerPlugin = require("image-minimizer-webpack-plugin");
const path = require('path');
const fs = require('fs');

const swcConfig = JSON.parse(fs.readFileSync('./.swcrc'));

const isProd = process.env.NODE_ENV === 'production';

module.exports = {
    context: path.join(__dirname, '/src/main/resources/assets'),
    entry: {
        // 'js/home/bundle': './js/home/main.ts',
        // 'js/launcher/bundle': './js/launcher/main.ts',
        // 'js/widgets/shortcuts': './js/widgets/shortcuts.ts',
        'styles/home': './styles/home.less',
        'styles/launcher': './styles/launcher.less',
        'styles/widgets/shortcuts': './styles/widgets/shortcuts.less',
        'styles/widgets/youtube': './styles/widgets/youtube.less',
    },
    output: {
        path: path.join(__dirname, '/build/resources/main/assets'),
        filename: './[name].js',
        assetModuleFilename: './[file]'
    },
    resolve: {
        extensions: ['.ts', '.js', '.less', '.css']
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                enforce: 'pre',
                use: ['source-map-loader'],
            },
            {
                test: /\.ts$/,
                use: [
                    {
                        loader: 'swc-loader',
                        options: {
                            ...swcConfig,
                            sourceMaps: isProd ? false : 'inline',
                            inlineSourcesContent: !isProd,
                        },
                    },
                ],
            },
            {
                test: /\.less$/,
                use: [
                    {loader: MiniCssExtractPlugin.loader, options: {publicPath: '../'}},
                    {loader: 'css-loader', options: {sourceMap: !isProd, importLoaders: 1}},
                    {loader: 'postcss-loader', options: {sourceMap: !isProd}},
                    {loader: 'less-loader', options: {sourceMap: !isProd}},
                ]
            },
            {
                test: /background.jpg$/,
                type: "asset",
                use: [
                    {
                        loader: ImageMinimizerPlugin.loader,
                        options: {
                            minimizer: {
                                implementation: ImageMinimizerPlugin.sharpMinify,
                                options: {
                                    encodeOptions: {
                                        jpeg: {
                                            quality: 38,
                                            progressive: true,
                                            compressionLevel: 9,
                                            adaptiveFiltering: true,
                                            effort: 10,
                                            mozjpeg: true,
                                            quantisationTable: 8,
                                        },
                                        webp: {
                                            quality: 10,
                                        }
                                    },
                                },
                            },
                        },
                    }
                ]
            }
        ]
    },
    optimization: {
        minimizer: [
            new TerserPlugin({
                extractComments: false,
                terserOptions: {
                    keep_classnames: true,
                    keep_fnames: true
                }
            }),
        ]
    },
    plugins: [
        new MiniCssExtractPlugin({
            filename: '[name].css',
            chunkFilename: './styles/[id].css'
        }),
        new CircularDependencyPlugin({
            exclude: /a\.js|node_modules/,
            failOnError: true
        }),
    ],
    mode: isProd ? 'production' : 'development',
    devtool: isProd ? false : 'source-map',
    performance: {hints: false}
};
