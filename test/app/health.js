const request = require('supertest');

const app = require('../../app');
const logger = require('../../server/logger');

describe('API Health', () => {
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

  describe('with downstream dependencies', () => {
    let server;
    before((done) => {
      app(config, logger, (err, _server) => {
        if (err) return done(err);
        server = _server;
        done();
      });
    });

    it('should return a 200 response with some content', () =>
      request(server)
        .get('/health')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .then((res) => {
          res.body.should.have.property('version');
          res.body.should.have.property('uptime');
          res.body.should.have.property('healthy', true);
          res.body.should.have.property('status', 'UP');
          res.body.should.have.property('checks');
        })
        .catch((err) => console.log(err)));
  });

  describe('with no downstream dependencies', () => {
    let server;
    before((done) => {
      app(config, logger, (err, _server) => {
        if (err) return done(err);
        server = _server;
        done();
      });
    });

    it('should return a 200 response with some content', () =>
      request(server)
        .get('/health')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .then((res) => {
          res.body.should.have.property('version');
          res.body.should.have.property('uptime');
          res.body.should.have.property('healthy', true);
          res.body.should.have.property('status', 'UP');
          res.body.should.have.property('checks');
        })
        .catch((err) => console.log(err)));
  });
});
