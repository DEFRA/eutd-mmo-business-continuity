const moment = require('moment');

const BUCKET_FILENAME = 'ecert_certificates.json';

const includeDocument = (doc) => (list) => {
  if (!doc.certNumber || !doc.timestamp) {
    throw new Error('"certNumber" and "timestamp" are required');
  }

  doc.timestamp = moment(doc.timestamp, 'YYYY-MM-DD').toISOString();

  return [doc, ...list.filter(entry => entry.certNumber !== doc.certNumber)];
};

const excludeDocument = (certNumber) => (list) => {
  if (!certNumber) {
    throw new Error('"certNumber" is required');
  }

  return list.filter(entry => entry.certNumber !== certNumber);
};

class CertificateService {
  constructor(repository, opts) {
    this.logger = opts.logger;

    this.repository = repository;
    this.certificates = [];
  }

  list() {
    const service = this;

    return new Promise((resolve/*, reject*/) => {
      if (service.certificates.length > 0) {
        resolve(service.certificates);
        return;
      }

      return service.repository.download(BUCKET_FILENAME)
        .then(list => {
          service.certificates = list;
          resolve(list);
        });
    });
  }

  get(certNumber) {
    return this.list()
      .then(list => list.filter(entry => (entry.certNumber) === certNumber)[0]);
  }

  add(cert) {
    const service = this;

    return service.list()
      .then(includeDocument(cert))
      .then(list => service.repository.upload(BUCKET_FILENAME, list));
  }

  remove(certNumber) {
    const service = this;

    return service.list()
      .then(excludeDocument(certNumber))
      .then(list => service.repository.upload(BUCKET_FILENAME, list));
  }
}

module.exports = CertificateService;
