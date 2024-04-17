const request = require('supertest');

const app = require('../../app');
const logger = require('../../server/logger');

describe('API Key authentication', () => {
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

  let server;
  before((done) => {
    app(config, logger, (err, _server) => {
      if (err) return done(err);
      server = _server;
      done();
    });
  });

  it('should block access without auth', () =>
    request(server)
      .get('/api/certificates')
      .expect(401)
  );

  it('should block access with invalid auth', () =>
    request(server)
      .get('/api/certificates')
      .set('X-API-KEY', '871772e9-5fb3-4219-a852-3e0930288b6e')
      .expect(401)
  );

  it('should allow access with auth', () =>
    request(server)
      .get('/api/certificates')
      .set('X-API-KEY', config.service.apiAuth.token)
      // errors because we don't provide bucket credentials, but shows we get past auth check
      .expect(500)
  );

  it('should allow / access even without auth', () =>
    request(server)
      .get('/')
      .expect(200)
  );

  it('should allow /health access even without auth', () =>
    request(server)
      .get('/health')
      .expect(200)
  );

  it('should allow /api-docs access even without auth', () =>
    request(server)
      .get('/api-docs')
      .expect(200)
  );

  it('should allow /swagger access even without auth', () =>
    request(server)
      .get('/swagger')
      .expect(200)
  );
});
