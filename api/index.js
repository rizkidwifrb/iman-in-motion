const app = require('../app');

module.exports = (req, res) => {
  const pathParam = req.query?.path;
  if (pathParam && (req.url === '/api' || req.url.startsWith('/api?'))) {
    const [, rawQuery = ''] = req.url.split('?');
    const query = new URLSearchParams(rawQuery);
    query.delete('path');
    const normalizedPath = Array.isArray(pathParam) ? pathParam.join('/') : String(pathParam);
    const nextQuery = query.toString();
    req.url = `/api/${normalizedPath}${nextQuery ? `?${nextQuery}` : ''}`;
  }
  return app(req, res);
};
