require('dotenv').config();
const pkg = require('../package.json');
const env = process.env;

const dev = env.NODE_ENV !== 'production';

const get = (name, fallback, options = {}) => {
  if (process.env[name]) {
    return process.env[name];
  }

  if (fallback !== undefined && (dev || !options.requireInProduction)) {
    return fallback;
  }

  throw new Error('Missing env var ' + name);
};

let config = {
  name: pkg.name,
  version: pkg.version,

  logLevel: get('LOG_LEVEL', 'debug'),

  dev: dev,
  buildDate: env.BUILD_DATE,
  commitId: env.COMMIT_ID,
  buildTag: env.BUILD_TAG,

  port: get('PORT', 3000),

  service: {
    apiAuth: {
      token: get('API_AUTH_TOKEN', '00000000-0000-1000-A000-000000000000', { requireInProduction: true }),
    },

    awsAccessKeyId: get('AWS_ACCESS_KEY_ID', undefined, { requireInProduction: true }),
    awsSecretAccessKey: get('AWS_SECRET_ACCESS_KEY', undefined, { requireInProduction: true }),
    awsBucketName: get('AWS_BUCKET_NAME', 'mmo-export-certificates', { requireInProduction: true }),
    awsBucketRegion: get('AWS_BUCKET_REGION', 'eu-west-1', { requireInProduction: true }),
  },

  // default = {admin: admin}
  users: JSON.parse(Buffer.from(get('ADMIN_USER_CREDENTIALS', 'eyJhZG1pbiI6ImFkbWluIn0=', { requireInProduction: true }), 'base64').toString('utf8')),
};

module.exports = config;
