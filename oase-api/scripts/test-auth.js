import http from 'node:http';

function post(path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request(
      {
        hostname: 'localhost',
        port: 3000,
        path: `/api/v1${path}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
        },
      },
      (res) => {
        let response = '';
        res.on('data', (chunk) => (response += chunk));
        res.on('end', () => resolve({ status: res.statusCode, body: response }));
      },
    );
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

(async () => {
  const login = await post('/auth/login', {
    email: 'admin@oase.ci',
    password: 'Oase@2026!',
  });
  console.log('Login:', login.status, login.body);
})();
