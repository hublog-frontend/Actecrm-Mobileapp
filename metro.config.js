const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const { wrapWithReanimatedMetroConfig } = require('react-native-reanimated/metro-config');

const config = {
  resolver: {
    blockList: [
      /node_modules\/.*\/android\/.*/,
      /node_modules\/.*\/ios\/.*/,
    ],
  },
};

module.exports = wrapWithReanimatedMetroConfig(mergeConfig(getDefaultConfig(__dirname), config));
