'use strict';

const autoprefixer = require('autoprefixer');
const nodeExternals = require('webpack-node-externals');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const fs = require('fs');
const webpack = require('webpack');
const path = require('path');
const GLOBALS = {
    'process.env': {
        'NODE_ENV': JSON.stringify('production')
    }
};
const publicURL = (env) => {
    const environments = {
        dev: {
            NODE_ENV: process.env.NODE_ENV,
            PUBLIC_URL: '/resources/src'
        },
        prod: {
            NODE_ENV: process.env.NODE_ENV,
            PUBLIC_URL: '/container/decision-engine-service-container/'
        }
    }
    return environments[env] || environments['dev']
}

module.exports = (env) => {
    env = {};
    env.dev = true;
    return {
        devtool: 'source-map',
        entry: env.dev
            ? [
                path.resolve(__dirname, '../resources/src/js/index')]
            : [
                path.resolve(__dirname, '../resources/src/js/index'),
            ],
        output: env.dev
            ? {
                path: path.resolve(__dirname, '../public/build'),
                filename: 'bundle.js',
                publicPath: '/',
            }
            : {
                path: path.resolve(__dirname, '../public/build'),
                filename: 'bundle.js',
                publicPath: '/container/decision-engine-service-container/',
            }
        ,
        module: {
            rules: [
                {
                    test: /\.(js|jsx)$/,
                    include: path.resolve(__dirname, '../resources/src/js'),
                    exclude: /node_modules/,
                    loader: 'babel-loader',
                    options: {
                        babelrc: false,
                        presets: [
                            require.resolve('babel-preset-react'),
                            require.resolve('babel-preset-es2015'),
                            require.resolve('babel-preset-es2016'),
                            require.resolve('babel-preset-es2017'),
                        ],
                        plugins: [
                            require.resolve('babel-plugin-transform-runtime')
                        ],
                        cacheDirectory: env.dev ? true : false
                    },
                },
            ]
        },
        plugins: env.dev
            ? [
                new webpack.optimize.UglifyJsPlugin({
                    minimize: true, compress: {
                        unused: true,
                        dead_code: true,
                        warnings: false,
                        // drop_debugger: true,
                        conditionals: true,
                        evaluate: true,
                        // drop_console: true,
                        sequences: true,
                        booleans: true,
                    }
                }),
            ]
            : [
                new webpack.DefinePlugin(GLOBALS),
                new webpack.optimize.UglifyJsPlugin({ minimize: true, compress: { warnings: false } }),
                new webpack.optimize.CommonsChunkPlugin({ name: 'bundle', filename: 'bundle.js' }),
            ],
        performance: {
            hints: env.dev ? false : 'warning'
        },
    }
}