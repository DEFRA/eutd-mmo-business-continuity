module.exports = {
  validation,
  unauthorised,
  notFound,
  unexpected,
};

function errorResponse(res, status, code, details, more = {}) {
  const response = Object.assign(
    {error: code, details},
    more
  );

  console.log('status', status);
  console.log(response);

  res.status(status);
  res.json(response);
};

function validation(res, details, more = {}) {
  errorResponse(res, 400, 'validation', details, more);
}

function unauthorised(res, details, more = {}) {
  errorResponse(res, 401, 'unauthorised', details, more);
}

function notFound(res, details, more = {}) {
  errorResponse(res, 404, 'not-found', details, more);
}

function unexpected(res, err) {
  errorResponse(res, err.status || 500, 'unexpected', err.message);
}
