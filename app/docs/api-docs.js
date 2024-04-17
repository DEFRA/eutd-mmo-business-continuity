const fs = require('fs');
const path = require('path');

const express = require('express');
const router = new express.Router();

const yaml = require('js-yaml');
const swaggerUi = require('swagger-ui-express');

const swaggerYaml = fs.readFileSync(path.join(__dirname, './api-docs.yaml'), 'utf8');
const swaggerObject = yaml.safeLoad(swaggerYaml);

module.exports = () => {
  router.get('/api-docs', (req, res) => res.json(swaggerObject));
  router.get('/swagger', swaggerUi.setup(swaggerObject));
  router.use('/', swaggerUi.serve);

  return router;
};
