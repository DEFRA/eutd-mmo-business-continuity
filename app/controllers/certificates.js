const express = require('express');
const router = new express.Router();
const moment = require('moment');

const helpers = require('../helpers');

// const STATUS_DRAFT = 'DRAFT';
const STATUS_COMPLETE = 'COMPLETE';
// const STATUS_VOID = 'VOID';

// private

const renderResult = (res) => helpers.format(res, 'result');

const createResultViewModel = (certNumber) => (found) => ({
  certNumber: certNumber,
  timestamp: found && found.timestamp && moment(found.timestamp).format('DD MMMM YYYY'),
  status: (found && found.status),
  isValid: found && found.status && found.status.toUpperCase() === STATUS_COMPLETE,
});

const retrieveCertificate = (res, certNumber) => {
  if (certNumber === 'GBR-2018-CC-123A4BC56') { // example on web page
    return Promise.resolve();
  }

  return res.services.certificates.get(certNumber);
};

const redirectToResult = (req, res /* , next */) =>
  helpers.redirect(res, `/certificates/${req.query.certNumber.trim()}`)();

const verifyCertNumber = (req, res, next) =>
  retrieveCertificate(res, (req.params.certNumber || '').trim())
    .then(createResultViewModel(req.params.certNumber.trim()))
    .then(renderResult(res))
    .catch(helpers.failWithError(res, next));

module.exports = () => {
  router.get('/', redirectToResult);
  router.get('/:certNumber', verifyCertNumber);

  return router;
};
