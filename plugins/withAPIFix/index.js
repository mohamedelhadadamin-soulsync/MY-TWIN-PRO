const { withProjectBuildGradle } = require('@expo/config-plugins');

const withAPIFix = (config) => {
  return withProjectBuildGradle(config, (gradle) => {
    gradle.modResults.contents = gradle.modResults.contents.replace(
      /defaultConfig\s*{/,
      `defaultConfig {
        ndk {
            abiFilters "armeabi-v7a", "arm64-v8a", "x86", "x86_64"
        }`
    );
    return gradle;
  });
};

module.exports = withAPIFix;
