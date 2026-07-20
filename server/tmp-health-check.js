const http = require('http');
const { app } = require('./src/app');
const server = http.createServer(app);
server.listen(0, () => {
  const { port } = server.address();
  const req = http.get({ host: '127.0.0.1', port, path: '/api/health' }, (res) => {
    let body = '';
    res.on('data', (chunk) => {
      body += chunk;
    });
    res.on('end', () => {
      console.log('status=' + res.statusCode);
      console.log(body);
      server.close();
    });
  });
  req.on('error', (err) => {
    console.error(err);
    server.close();
  });
});
