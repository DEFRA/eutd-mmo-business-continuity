const express = require('express');

const request = require('supertest');
const bodyParser = require('body-parser');

const CertificatesService = require('../../../app/services/certificates');

const apiController = require('../../../app/controllers/api');

describe('/api', () => {
  const fakeApiToken = 'fake-token';

  before(() => {
    this.server = express();
    this.data = {};

    const logger = { info: () => {} };

    this.server.use((req, res, next) => {
      res.services = {
        certificates: new CertificatesService({
          download: (key) => {
            return Promise.resolve(this.data[key] || []);
          },
          upload: (key, data) => {
            this.data[key] = data;

            return Promise.resolve();
          }
        }, { logger }),
      };

      res.config = {
        service: {
          apiAuth: {
            token: fakeApiToken,
          }
        }
      };

      next();
    });

    this.server.use(bodyParser.urlencoded({ extended: false }));
    this.server.use(bodyParser.json());

    this.server.use('/api', apiController(logger));
  });

  // GET /api/certificates

  it('should get the list', () =>
    request(this.server).get(`/api/certificates`)
        .set('Accept', 'application/json')
        .set('X-API-KEY', fakeApiToken)
        .expect(200)
        .then(response => {
          response.body.should.deep.equal([]);
        })
  );

  // PUT /api/certificates/:certNumber
  // GET /api/certificates

  it('should append to the list', () => {
    const cert = {
      certNumber: 'test-id',
      timestamp: '2000-01-01T00:00:00.000Z',
      status: 'DUMB',
    };

    return request(this.server).put(`/api/certificates/${cert.certNumber}`)
      .set('content-type', 'application/json')
      .set('Accept', 'application/json')
      .set('X-API-KEY', fakeApiToken)
      .send(cert)
      .expect(200)
      .then(response => {
        response.body.message.should.equal('SUCCESS');

        return request(this.server).get(`/api/certificates`)
          .set('Accept', 'application/json')
          .set('X-API-KEY', fakeApiToken)
          .expect(200)
          .then(response => {
            response.body.should.have.length(1);
            response.body[0].should.have.property('certNumber', 'test-id');
            response.body[0].should.have.property('timestamp', '2000-01-01T00:00:00.000Z');
            response.body[0].should.have.property('status', 'DUMB');
          });
      });
  });
});
