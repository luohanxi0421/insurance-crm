const base = require('./app.config.base.json');

const expo = base.expo || {};
const existingPlugins = Array.isArray(expo.plugins) ? expo.plugins : [];

const hasEnv = (name) => Boolean(process.env[name] && String(process.env[name]).trim());

const hasDsn = hasEnv('EXPO_PUBLIC_SENTRY_DSN');
const hasUploadConfig = ['SENTRY_AUTH_TOKEN', 'SENTRY_ORG', 'SENTRY_PROJECT'].every(hasEnv);
const isEasBuild = process.env.EAS_BUILD === '1';

const pluginsWithoutSentry = existingPlugins.filter((plugin) => {
  if (typeof plugin === 'string') {
    return plugin !== '@sentry/react-native/expo';
  }
  if (Array.isArray(plugin) && typeof plugin[0] === 'string') {
    return plugin[0] !== '@sentry/react-native/expo';
  }
  return true;
});

if (isEasBuild && hasDsn && !hasUploadConfig) {
  throw new Error(
    'Sentry config is incomplete for EAS Build. Missing one or more of SENTRY_AUTH_TOKEN, SENTRY_ORG, SENTRY_PROJECT.'
  );
}

const plugins = hasDsn && hasUploadConfig
  ? [...pluginsWithoutSentry, '@sentry/react-native/expo']
  : pluginsWithoutSentry;

module.exports = {
  ...base,
  expo: {
    ...expo,
    plugins,
  },
};