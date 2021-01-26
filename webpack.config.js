const path = require('path')
const webpack = require('webpack')

module.exports = {
    entry: './frontendjs/main.js',
    output: {
        filename: 'main-bundled.js',
        path: path.resolve(__dirname, 'public')
    } ,
    mode: "production",
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node-modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env']
                    }
                }
            }
        ]
    }
}