const express = require('express');
const router = new express.Router();

const helpers = require('../helpers');

// private

const ensureAuthenticated = require('connect-ensure-login').ensureLoggedIn();

const createAdminViewModel = (req) => (/* data */) => {
  const year = req.body['timestamp-year'];
  const month = req.body['timestamp-month'];
  const day = req.body['timestamp-day'];

  const timestamp = (year && day && month) ? new Date(1 * year, 1 * month - 1, 1 * day).toISOString() : undefined;

  return {
    certNumber: req.body.certNumber,
    timestamp: timestamp || req.body.timestamp,
    status: req.body.status,
  };
};

const displayStartPage = (req, res, next) =>
  Promise.resolve({})
    .then(createAdminViewModel(req))
    .then(helpers.format(res, 'admin/start-page'))
    .catch(helpers.failWithError(res, next));

const enterCertificateNumber = (req, res, next) =>
  Promise.resolve({})
    .then(createAdminViewModel(req))
    .then(helpers.format(res, 'admin/enter-certificate-number'))
    .catch(helpers.failWithError(res, next));

const enterIssueDate = (req, res, next) =>
  Promise.resolve({})
    .then(createAdminViewModel(req))
    .then(helpers.format(res, 'admin/enter-issue-date'))
    .catch(helpers.failWithError(res, next));

const enterCertificateStatus = (req, res, next) =>
  Promise.resolve({})
    .then(createAdminViewModel(req))
    .then(helpers.format(res, 'admin/enter-certificate-status'))
    .catch(helpers.failWithError(res, next));

const checkCertificateDetails = (req, res, next) =>
  Promise.resolve({})
    .then(createAdminViewModel(req))
    .then(helpers.format(res, 'admin/check-certificate-details'))
    .catch(helpers.failWithError(res, next));

const acceptCertificateDetails = (req, res, next) =>
  Promise.resolve({})
    .then(createAdminViewModel(req))
    .then(cert => res.services.certificates.add(cert).then(() => cert))
    .then(helpers.format(res, 'admin/confirmation'))
    .catch(helpers.failWithError(res, next));

module.exports = () => {
  router.get('/', ensureAuthenticated, displayStartPage);
  router.get('/enter-certificate-number', ensureAuthenticated, enterCertificateNumber);
  router.post('/enter-issue-date', ensureAuthenticated, enterIssueDate);
  router.post('/enter-certificate-status', ensureAuthenticated, enterCertificateStatus);
  router.post('/check-certificate-details', ensureAuthenticated, checkCertificateDetails);
  router.post('/save-certificate-details', ensureAuthenticated, acceptCertificateDetails);

  return router;
};
