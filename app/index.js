const path = require('path');

const nunjucks = require('nunjucks');
const express = require('express');
const bunyanMiddleware = require('bunyan-middleware');
const expressNunjucks = require('express-nunjucks');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const favicon = require('serve-favicon');
const xFrameOptions = require('x-frame-options');
const moment = require('moment');
const acceptFileExtensions = require('accepts-ext');

const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

const errors = require('../server/errors');
const helpers = require('./helpers');
const healthcheck = require('./helpers/healthcheck');

const S3BucketRepository = require('./repositories/S3Bucket');

const CertificatesService = require('./services/certificates');

const indexController = require('./controllers/index');
const certificatesController = require('./controllers/certificates');
const apiController = require('./controllers/api');
const adminController = require('./controllers/admin');
const apiDocsController = require('./docs/api-docs');

// eslint-disable-next-line no-unused-vars
const formatDate = (str, format) => moment(str).format(format);
const slugify = (str) => str.replace(/[.,-\/#!$%\^&\*;:{}=\-_`~()’]/g,"").replace(/ +/g,'_').toLowerCase();
const htmlLog = (nunjucksSafe) => (a) => nunjucksSafe('<script>console.log(' + JSON.stringify(a, null, '\t') + ');</script>');
const isObject = (x) => x != null && typeof x === 'object' && Array.isArray(x) === false;
const isArray = (x) => Array.isArray(x);

function setupBaseMiddleware(app, log) {
  app.set('trust proxy', 1); // trust first proxy

  app.use(bunyanMiddleware({
    logger: log,
    obscureHeaders: ['Authorization', 'X-API-KEY'],
  }));

  app.use(helmet());
  app.use(helmet.noCache());
  app.use(helmet.referrerPolicy({ policy: 'same-origin' }));

  app.use(session({
    secret: 'mmo-check-export-certificates',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: !app.locals.config.dev }
  }));

  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());
  app.use(xFrameOptions());
}

function setupOperationalRoutes(app, logger) {
  logger.info('Registering operational routes...');

  logger.info('GET: /swagger');
  app.use('/', apiDocsController(logger));

  logger.info('GET: /health');
  app.get('/health', (req, res) =>
    healthcheck(app.locals.config, req.log)
      .then((result) => {
        if (!result.healthy) {
          res.status(500);
        }

        res.json(result);
      })
      .catch((err) => errors.unexpected(res, err.message)));
}

function setupViewEngine (app) {
  let config = app.locals.config;

  app.set('view engine', 'njk');
  app.set('views', [
    path.join(__dirname, '../app/views'),
    path.join(__dirname, '../node_modules/govuk-frontend'),
  ]);

  var njk = expressNunjucks(app, {
      loader: nunjucks.FileSystemLoader,
      autoescape: true,
      watch: config.dev
  });

  njk.env.addFilter('slugify', slugify);
  njk.env.addFilter('formatDate', formatDate);
  njk.env.addFilter('log', htmlLog(njk.env.getFilter('safe')));
  njk.env.addFilter('isObject', isObject);
  njk.env.addFilter('isArray', isArray);

  return app;
}

function setupStaticRoutes (app, logger) {
  logger.info('Registering static routes...');

  app.use(favicon(path.join(__dirname, '../node_modules/govuk-frontend/govuk/assets/images/favicon.ico')));
  app.use('/public', express.static(path.join(__dirname, '../public')));

  app.use('/assets', express.static(path.join(__dirname, '../node_modules/govuk-frontend/govuk/assets')));

  // send assetPath to all views
  app.use(function (req, res, next) {
    res.locals.asset_path = "/public/";
    next();
  });

  return app;
}

function setupAuth(app, logger) {
  passport.use(new LocalStrategy(
    function(username, password, done) {
      const validUser = true;
      const userPassword = app.locals.config.users[username];

      if (!userPassword) {
        logger.info(`Invalid username "${ username }" entered`);
        validUser = false;
      }

      if (validUser && userPassword !== password) {
        validUser = false;
        logger.info(`Invalid password entered for "${ username }" entered`);
      }

      if (!validUser) {
        return done(null, false, { message: 'Invalid credentials' });
      }

      return done(null, { id: `${username}`, username: `${username}` });
    }
  ));

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser((username, done) => {
    done(null, app.locals.config.users[username]);
  });

  // Passport init
  app.use(passport.initialize());
  app.use(passport.session());

  app.get('/login', (req, res, next) => Promise.resolve({})
      .then(helpers.format(res, 'admin/login'))
      .catch(helpers.failWithError(res, next)));
  app.post('/login', passport.authenticate('local', {
    successRedirect: '/admin',
    failureRedirect: '/login'
  }));
}

function setupRouters(app, logger) {
  app.use(acceptFileExtensions);

  logger.info('registering repositories...');

  const config = app.locals.config.service;

  logger.info('S3 Bucket Repository');
  const certificatesRepository = new S3BucketRepository({
    logger,
    accessKeyId: config.awsAccessKeyId,
    secretAccessKey: config.awsSecretAccessKey,
    region: config.awsRegion,
    bucketName: config.awsBucketName,
  });

  app.use((req, res, next) => {
    res.config = app.locals.config;
    res.services = {
      certificates: new CertificatesService(certificatesRepository, { logger }),
    };

    next();
  });

  logger.info('registering controllers...');

  logger.info('GET: /');
  app.use('/', indexController(logger));

  logger.info('GET: /certificates');
  app.use('/certificates', certificatesController(logger));

  logger.info('GET: /api');
  app.use('/api', apiController(logger));

  logger.info('GET: /admin');
  app.use('/admin', adminController(app, logger));
};

function setupErrorHandling(app, logger) {
  app.use(function notFoundHandler(req, res) {
    const msg = `404: No handler exists for [${req.method}: ${req.originalUrl}]`;

    logger.warn(msg);
    errors.notFound(res, msg);
  });

  // eslint-disable-next-line no-unused-vars
  app.use(function errorHandler(err, req, res, next) {
    logger.error(err);
    errors.unexpected(res, err);
  });
}

module.exports = (config, logger, callback, includeErrorHandling = true) => {
  const app = express();
  app.locals.config = config;

  app.set('json spaces', 2);
  app.set('trust proxy', true);

  setupBaseMiddleware(app, logger);
  setupOperationalRoutes(app, logger);
  setupViewEngine(app, logger);
  setupStaticRoutes(app, logger);
  setupAuth(app, logger);
  setupRouters(app, logger);

  if (includeErrorHandling) {
    setupErrorHandling(app, logger);
  }

  healthcheck(config, logger)
    .then((result) => {
      if (!result.healthy) {
        return logger.error(result);
      }

      logger.info(result);
    });

  return callback(null, app);
};
