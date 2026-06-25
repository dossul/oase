import http from 'node:http';

function get(path) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:3000${path}`, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    }).on('error', reject);
  });
}

(async () => {
  const health = await get('/api/v1/health');
  console.log('Health:', health.status, health.body);
  const root = await get('/api/v1/');
  console.log('Root:', root.status, root.body);
})();
