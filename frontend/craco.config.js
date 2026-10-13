const path = require('path');
require('dotenv').config();

const enableHealthCheck =
  process.env.ENABLE_HEALTH_CHECK === 'true';

let WebpackHealthPlugin;
let setupHealthEndpoints;
let healthPluginInstance;

if (enableHealthCheck) {
  WebpackHealthPlugin = require('./plugins/health-check/webpack-health-plugin');
  setupHealthEndpoints = require('./plugins/health-check/health-endpoints');
  healthPluginInstance = new WebpackHealthPlugin();
}

module.exports = {
  eslint: {
    configure: {
      extends: ['plugin:react-hooks/recommended'],
      rules: {
        'react-hooks/rules-of-hooks': 'error',
        'react-hooks/exhaustive-deps': 'warn',
      },
    },
  },

  webpack: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },

    configure: (webpackConfig) => {
      // Reduce unnecessary file watching for faster development.
      webpackConfig.watchOptions = {
        ...webpackConfig.watchOptions,

        ignored: [
          '**/node_modules/**',
          '**/.git/**',
          '**/build/**',
          '**/dist/**',
          '**/coverage/**',
          '**/public/**',
        ],
      };

      // Optional health-check plugin.
      if (enableHealthCheck && healthPluginInstance) {
        webpackConfig.plugins.push(
          healthPluginInstance
        );
      }

      return webpackConfig;
    },
  },

  devServer: (devServerConfig) => {
    // Optional health-check endpoints.
    if (
      enableHealthCheck &&
      setupHealthEndpoints &&
      healthPluginInstance
    ) {
      const originalSetupMiddlewares =
        devServerConfig.setupMiddlewares;

      devServerConfig.setupMiddlewares = (
        middlewares,
        devServer
      ) => {
        if (originalSetupMiddlewares) {
          middlewares =
            originalSetupMiddlewares(
              middlewares,
              devServer
            );
        }

        setupHealthEndpoints(
          devServer,
          healthPluginInstance
        );

        return middlewares;
      };
    }

    return devServerConfig;
  },
};