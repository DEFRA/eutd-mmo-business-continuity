const express = require('express');
const router = express.Router();

const request = require('supertest');

const app = require('../../app');
const logger = require('../../server/logger');

describe('API Security', () => {
  let server;
  let paths = [ 'get', 'post', 'put', 'delete' ];

  before((done) => {
    paths.forEach((method) =>
      router[ method ](`/${method}`, (req, res) => res.json({ hello: 'world' })));

    const config = {
      service: {
        apiAuth: {
          token: '2be60db6-68ad-4b57-aa99-457e6bbdf6c8',
        },

        awsAccessKeyId: '',
        awsSecretAccessKey: '',
        awsBucketName: '',
        awsBucketRegion: '',
      },
    };

    app(config, logger, (err, _server) => {
      if (err) return done(err);
      server = _server;

      server.use('/tests', router);

      done();
    }, false);
  });

  it('should include the "X-Frame-Options" header in responses from each url', () => {
    return Promise.all(paths.map((method) =>
      request(server)[method](`/tests/${method}`)
        .set('Accept', 'application/json')
        .expect('X-Frame-Options', /Deny/)
        .expect(200)
    ));
  });

  it('should specify private cache control on routes', () => {
    return Promise.all(paths.map((method) =>
      request(server)[method](`/tests/${method}`)
        .set('Accept', 'application/json')
        .expect('cache-control', /no-store/)
        .expect('cache-control', /no-cache/)
        .expect('cache-control', /must-revalidate/)
        .expect(200)
    ));
  });

  it('should specify pragma cache control on routes', () => {
    return Promise.all(paths.map((method) =>
      request(server)[method](`/tests/${method}`)
        .set('Accept', 'application/json')
        .expect('pragma', /no-cache/)
        .expect(200)
    ));
  });

  it('should specify expires header set to "0" on routes', () => {
    return Promise.all(paths.map((method) =>
      request(server)[method](`/tests/${method}`)
        .set('Accept', 'application/json')
        .expect('expires', /0/)
        .expect(200)
    ));
  });

  it('should specify a same-origin referrer policy on routes', () => {
    return Promise.all(paths.map((method) =>
      request(server)[method](`/tests/${method}`)
        .set('Accept', 'application/json')
        .expect('Referrer-Policy', /same-origin/)
        .expect(200)
    ));
  });
});
