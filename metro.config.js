const { getDefaultConfig } = require("expo/metro-config");
const { withRorkMetro } = require("@rork-ai/toolkit-sdk/metro");

const config = getDefaultConfig(__dirname);

config.resolver.assetExts = Array.from(
  new Set([...(config.resolver.assetExts || []), 'bin', 'tflite', 'txt'])
);

// Add resolver to block Node.js-only TensorFlow backends
config.resolver = {
  ...config.resolver,
  resolveRequest: (context, moduleName, platform) => {
    // Block Node.js-only backends
    if (
      moduleName === '@tensorflow/tfjs-backend-cpu' ||
      moduleName === '@tensorflow/tfjs-backend-wasm' ||
      moduleName === '@tensorflow/tfjs-node' ||
      moduleName === '@tensorflow/tfjs-node-gpu' ||
      moduleName === 'long' // Block 'long' package required by tf.node.js
    ) {
      return {
        type: 'empty',
      };
    }
    return context.resolveRequest(context, moduleName, platform);
  },
};

module.exports = withRorkMetro(config);