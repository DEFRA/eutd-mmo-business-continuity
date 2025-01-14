const express = require('express');
const router = new express.Router();

const helpers = require('../helpers');

// private

const renderIndex = (res) => helpers.format(res, 'index');

const createIndexViewModel = (/* req */) => (/* data */) => ({});

const displayIndex = (req, res, next) =>
  Promise.resolve({})
    .then(createIndexViewModel(req))
    .then(renderIndex(res))
    .catch(helpers.failWithError(res, next));

module.exports = () => {
  router.get('/', displayIndex);

  return router;
};
