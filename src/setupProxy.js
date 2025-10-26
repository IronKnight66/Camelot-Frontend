const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  const proxyOptions = {
    target: 'http://localhost:8000',
    changeOrigin: false,
    secure: false,
    logLevel: 'debug',
    onProxyReq: (proxyReq, req, res) => {
      console.log('Proxying request:', req.method, req.url);
      // Forward Authorization header if present
      if (req.headers.authorization) {
        const authHeader = req.headers.authorization;
        console.log('Authorization header details:', {
          length: authHeader.length,
          prefix: authHeader.substring(0, 50),
          suffix: authHeader.substring(authHeader.length - 50),
          startsWithBearer: authHeader.startsWith('Bearer '),
          fullHeader: authHeader
        });
        
        proxyReq.setHeader('Authorization', authHeader);
      } else {
        console.log('No Authorization header found in request');
      }
    },
    onProxyRes: (proxyRes, req, res) => {
      console.log('Proxy response:', proxyRes.statusCode, req.url);
      if (proxyRes.statusCode === 403) {
        console.log('403 Forbidden - Check if user has proper permissions');
      }
    }
  };

  // Proxy /auth endpoints
  app.use(
    '/auth',
    createProxyMiddleware(proxyOptions)
  );

  // Proxy /api endpoints
  app.use(
    '/api',
    createProxyMiddleware(proxyOptions)
  );
};

