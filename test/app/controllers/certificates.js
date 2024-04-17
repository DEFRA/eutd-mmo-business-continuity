const express = require('express');

const request = require('supertest');
const bodyParser = require('body-parser');

const CertificatesService = require('../../../app/services/certificates');

const apiController = require('../../../app/controllers/api');
const certificatesController = require('../../../app/controllers/certificates');

describe('/certificates/{certNumber}', () => {
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
    this.server.use('/certificates', certificatesController(logger));
  });

  it('should not recognise a certificate number that has not been submitted', () => {
    return request(this.server).get(`/certificates/ghost-cert`)
      .set('Accept', 'application/json')
      .set('X-API-KEY', fakeApiToken)
      .expect(200)
      .then(response => {
        response.body.should.have.property('certNumber', 'ghost-cert');
        response.body.should.not.have.property('timestamp');
        response.body.should.not.have.property('status');
        response.body.should.not.have.property('isValid');
      });
  });

  it('should recognise a certificate with no status as invalid', () => {
    const cert = {
      certNumber: 'test-id',
      timestamp: '2000-01-01T00:00:00.000Z',
    };

    return request(this.server).put(`/api/certificates/${cert.certNumber}`)
      .set('content-type', 'application/json')
      .set('Accept', 'application/json')
      .set('X-API-KEY', fakeApiToken)
      .send(cert)
      .expect(200)
      .then(response => {
        response.body.message.should.equal('SUCCESS');

        return request(this.server).get(`/certificates/${cert.certNumber}`)
          .set('Accept', 'application/json')
          .set('X-API-KEY', fakeApiToken)
          .expect(200)
          .then(response => {
            response.body.should.have.property('certNumber', 'test-id');
            response.body.should.have.property('timestamp', '01 January 2000');
            response.body.should.not.have.property('status');
            response.body.should.not.have.property('isValid');
          });
      });
  });

  it('should recognise a certificate with a status of VOID as invalid', () => {
    const cert = {
      certNumber: 'test-id',
      timestamp: '2000-01-01T00:00:00.000Z',
      status: 'VOID',
    };

    return request(this.server).put(`/api/certificates/${cert.certNumber}`)
      .set('content-type', 'application/json')
      .set('Accept', 'application/json')
      .set('X-API-KEY', fakeApiToken)
      .send(cert)
      .expect(200)
      .then(response => {
        response.body.message.should.equal('SUCCESS');

        return request(this.server).get(`/certificates/${cert.certNumber}`)
          .set('Accept', 'application/json')
          .set('X-API-KEY', fakeApiToken)
          .expect(200)
          .then(response => {
            response.body.should.have.property('certNumber', 'test-id');
            response.body.should.have.property('timestamp', '01 January 2000');
            response.body.should.have.property('status', 'VOID');
            response.body.should.have.property('isValid', false);
          });
      });
  });

  it('should recognise a certificate with a status of COMPLETE as valid', () => {
    const cert = {
      certNumber: 'test-id',
      timestamp: '2000-01-01T00:00:00.000Z',
      status: 'COMPLETE',
    };

    return request(this.server).put(`/api/certificates/${cert.certNumber}`)
      .set('content-type', 'application/json')
      .set('Accept', 'application/json')
      .set('X-API-KEY', fakeApiToken)
      .send(cert)
      .expect(200)
      .then(response => {
        response.body.message.should.equal('SUCCESS');

        return request(this.server).get(`/certificates/${cert.certNumber}`)
          .set('Accept', 'application/json')
          .set('X-API-KEY', fakeApiToken)
          .expect(200)
          .then(response => {
            response.body.should.have.property('certNumber', 'test-id');
            response.body.should.have.property('timestamp', '01 January 2000');
            response.body.should.have.property('status', 'COMPLETE');
            response.body.should.have.property('isValid', true);
          });
      });
  });
});
