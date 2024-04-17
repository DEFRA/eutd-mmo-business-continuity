const express = require('express');
const router = new express.Router();

const helpers = require('../helpers');
const errors = require('../../server/errors');

// private

const renderSuccess = (res, model) => () => res.json(model);
const renderJson = (res) => (model) => res.json(model);

function isAuthenticated(req, res, next) {
  if (req.get('X-API-KEY') !== res.config.service.apiAuth.token) {
    return errors.unauthorised(res, 'API key is missing or invalid');
  }

  return next();
}

const addCertNumber = (req, res, next) =>
  res.services.certificates.add(req.body)
    .then(renderSuccess(res, { 'message': 'SUCCESS' }))
    .catch(helpers.failWithError(res, next));

const deleteCertNumber = (req, res, next) =>
  res.services.certificates.remove(req.params.certNumber)
    .then(renderSuccess(res, { 'message': 'SUCCESS' }))
    .catch(helpers.failWithError(res, next));

const listCertNumbers = (req, res, next) =>
  res.services.certificates.list()
    .then(renderJson(res))
    .catch(helpers.failWithError(res, next));

module.exports = () => {
  router.get('/certificates', isAuthenticated, listCertNumbers);
  router.put('/certificates/:certNumber', isAuthenticated, addCertNumber);
  router.delete('/certificates/:certNumber', isAuthenticated, deleteCertNumber);

  return router;
};
