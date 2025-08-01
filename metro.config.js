// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

const { withNativeWind } = require('nativewind/metro');

/** @type {import('expo/metro-config').MetroConfig} */

const config = getDefaultConfig(__dirname);

// Destructure the resolver from the config
const { resolver } = config;

// Add SVG to the asset extensions
config.transformer.babelTransformerPath = require.resolve('react-native-svg-transformer');
config.resolver.assetExts = resolver.assetExts.filter((ext) => ext !== 'svg');
config.resolver.sourceExts = [...resolver.sourceExts, 'svg'];

// Re-apply the NativeWind wrapper
module.exports = withNativeWind(config, { input: './global.css' });
