const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CircularDependencyPlugin = require('circular-dependency-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const ImageMinimizerPlugin = require("image-minimizer-webpack-plugin");
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
                test: /\.tsx?$/,
                use: [{loader: 'ts-loader', options: {configFile: 'tsconfig.build.json'}}]
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
                test: /\.(jpg)$/,
                type: "asset",
                use: [
                    {
                        loader: ImageMinimizerPlugin.loader,
                        options: {
                            deleteOriginalAssets: true,
                            filename: "[path][name].webp",
                            minimizerOptions: {
                                plugins: ["imagemin-webp"],
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
                terserOptions: {
                    compress: {
                        drop_console: false
                    },
                    keep_classnames: true,
                    keep_fnames: true
                }
            })
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
        }),/*
        new ImageMinimizerPlugin({
            // Only apply this one to files equal to or over 8192 bytes
            filter: (source) => {
                if (source.byteLength >= 8192) {
                    return true;
                }

                return false;
            },
            filename: "[path][name].webp",
            minimizerOptions: {
                plugins: ["imagemin-webp"],
            },
        }),*/
    ],
    mode: isProd ? 'production' : 'development',
    devtool: isProd ? false : 'eval-source-map',
    performance: {hints: false}
};
