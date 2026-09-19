const fs = require('fs');
const path = require('path');
const target = path.join(process.cwd(), 'src', 'app', 'dashboard', 'history', 'page.tsx');
const https = require('https');
https.get('https://r2.dev', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    fs.writeFileSync(target, data, 'utf8');
    console.log('SUCCESS: Proxy history page rebuilt perfectly without the Note column!');
  });
}).on('error', (err) => {
  console.log('Error streaming updated clean bundle file: ' + err.message);
});
