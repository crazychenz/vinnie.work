import path from 'path';
import webpack from 'webpack';
import HtmlWebPackPlugin from 'html-webpack-plugin';
import InlineChunkHtmlPlugin from 'react-dev-utils/InlineChunkHtmlPlugin.js';
import WebpackBar from 'webpackbar';
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';
import remarkCodeImport from 'remark-code-import';
import remarkEmoji from 'remark-emoji';
import remarkMath from 'remark-math';
import remarkFlattenImages from 'mdast-flatten-image-paragraphs';
import rehypeAutoImport from '@mdxp/rehypex-plugins/auto-import.js';
import rehypeBetterMedia from '@mdxp/rehypex-plugins/better-media.js';
import rehypeTableAlign from '@mdxp/rehypex-plugins/table-align.js';
import rehypeKatex from 'rehype-katex';

import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Main Config
export default (env) => {
  // Variables
  const PUBLIC_PATH = env.PUBLIC_PATH || '/';
  const ANALYZE = Boolean(env.ANALYZE) || false;
  const MDXP_MODE = (env.MDXP_MODE || 'web').toLowerCase();
  const DECK = env.DECK || '';

  // Mode Config
  let cfg = null;
  if (MDXP_MODE === 'onepage') {
    cfg = {
      output: {
        path: path.resolve(__dirname, `dist/${DECK}/onepage`),
        filename: 'main.js',
        publicPath: './'
      },
      babel: {
        presets: [
          [
            '@babel/preset-env',
            {modules: false}
          ],
          '@babel/preset-react'
        ],
        plugins: [
          ["module-resolver",
          {
            root: ["./src"],
          }],
        ],
      },
      inlineImageLimit: 10485760,
      plugins: [
        new InlineChunkHtmlPlugin(HtmlWebPackPlugin, [/.(js|css)$/])
      ]
    };
  } else {
    cfg = {
      output: {
        path: path.resolve(__dirname, `dist/${DECK}/web`),
        filename: 'main.js',
        publicPath: PUBLIC_PATH
      },
      babel: {
        presets: [
          [
            '@babel/preset-env',
            {modules: false}
          ],
          '@babel/preset-react'
        ],
        plugins: [
          ["module-resolver",
          {
            root: ["./src"],
          },
        ]],
      },
      inlineImageLimit: 8192,
      plugins: []
    };
  }

  if (ANALYZE) {
    cfg.plugins.push(
      new BundleAnalyzerPlugin({
        analyzerMode: 'disabled',
        generateStatsFile: true
      })
    );
  }

  return {

    //entry: './src/index.jsx',
    entry: `./decks/${DECK}/index.jsx`,
    output: cfg.output,

    module: {
      rules: [
        {
          oneOf: [
            {
              test: /\.(js|jsx)$/,
              exclude: /node_modules/,
              use: [
                {
                  loader: 'babel-loader',
                  options: cfg.babel
                }
              ]
            },
            {
              test: /\.mdx$/,
              use: [
                {
                  loader: 'babel-loader',
                  options: cfg.babel
                },
                {
                  loader: '@mdx-js/loader',
                  options: {
                    remarkPlugins: [
                      remarkCodeImport,
                      remarkEmoji,
                      remarkMath,
                      remarkFlattenImages
                    ],
                    rehypePlugins: [
                      rehypeKatex,
                      rehypeTableAlign,
                      [rehypeBetterMedia, {videoMarker: '!video!'}],
                      [rehypeAutoImport, {noImport: '!noimport!'}]
                    ]
                  }
                }
              ]
            },
            {
              test: /\.html$/,
              use: ['html-loader']
            },
            {
              test: /\.css$/,
              use: ['style-loader', 'css-loader']
            },
            {
              test: /\.svg$/,
              use: [
                {
                  loader: '@svgr/webpack',
                  options: {
                    svgo: false
                  }
                },
                'url-loader'
              ]
            },
            {
              test: /\.(png|jpe?g|gif|bmp|webp)$/i,
              use: [
                {
                  loader: 'url-loader',
                  options: {
                    limit: cfg.inlineImageLimit
                  }
                }
              ]
            },
            {
              exclude: [/\.(js|mjs|jsx|mdx)$/, /\.html$/, /\.json$/],
              use: ['file-loader']
            }
          ]
        }
      ]
    },

    plugins: [
      new WebpackBar(),
      new HtmlWebPackPlugin({
        template: path.resolve(__dirname, `decks/${DECK}/index.html`),
        filename: './index.html',
        inject: 'body',
      }),
      new webpack.DefinePlugin({
        'process.env.PUBLIC_PATH': JSON.stringify(PUBLIC_PATH)
      }),
      ...cfg.plugins
    ],

    devServer: {
      client: {
        overlay: {
          warnings: false,
          errors: true,
        },
      },
      liveReload: true,
      //static: './dist/web'
    },
    resolve: {
      fallback: {
        fs: false
      }
    }
  };
};