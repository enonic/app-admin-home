const ErrorLoggerPlugin = require('error-logger-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

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
        })
    ],
    devtool: 'source-map'
};
