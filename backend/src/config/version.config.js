/**
 * Mobile App Version Configuration
 * Allows dynamic updates via environment variables without rebuilding the backend
 */
const getVersionConfig = () => {
  return {
    latestVersion: process.env.APP_LATEST_VERSION || '1.1.1',
    minimumVersion: process.env.APP_MINIMUM_VERSION || '1.0.0',
    apkUrl:
      process.env.APP_APK_URL ||
      'https://expo.dev/artifacts/eas/mjJ7vezRhGzxUQ1jlZyPmCGiNG3TGHYLL789wtNCKxw.apk',
    updateMessage:
      process.env.APP_UPDATE_MESSAGE ||
      'DigentTech v1.1.1: Official Brand Logo & Modern Splash Screen!',
    forceUpdate: process.env.APP_FORCE_UPDATE === 'true',
    releaseDate: process.env.APP_RELEASE_DATE || new Date().toISOString(),
    fileSizeBytes: process.env.APP_FILE_SIZE_BYTES
      ? parseInt(process.env.APP_FILE_SIZE_BYTES, 10)
      : null,
  };
};

module.exports = {
  getVersionConfig,
};
