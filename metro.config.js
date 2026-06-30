const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// دعم ملفات إضافية (صور، صوت، نصوص)
config.resolver.assetExts = [
  ...config.resolver.assetExts,
  'mp3',
  'png',
  'jpg',
  'jpeg',
];

// دعم ملفات المصدر
config.resolver.sourceExts = [
  ...config.resolver.sourceExts,
  'sql',
  'txt',
  'jsonl',
];

// دعم المتغيرات البيئية
const originalGetTransformOptions = config.transformer.getTransformOptions;
config.transformer.getTransformOptions = async (entryPoints, options) => {
  const original = await originalGetTransformOptions(entryPoints, options);
  return {
    ...original,
    transform: {
      ...original?.transform,
      experimentalImportSupport: false,
      inlineRequires: true,
    },
  };
};

module.exports = config;
