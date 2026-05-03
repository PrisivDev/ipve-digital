const http = require('http');
const { spawn } = require('child_process');
const path = require('path');

console.log('Starting IPVE Digital production server...');

const srv = spawn('node', ['server.js', '-H', '0.0.0.0', '-p', '3000'], {
  cwd: path.join(__dirname, '.next', 'standalone'),
  env: { ...process.env, NODE_ENV: 'production' },
  stdio: ['pipe', 'inherit', 'inherit']
});

let ready = false;
srv.on('exit', (code) => {
  console.log('Server exited with code ' + code);
  process.exit(code || 0);
});

// Give server time to start
setTimeout(() => {
  // Test homepage
  http.get('http://127.0.0.1:3000/', (res) => {
    let data = '';
    res.on('data', c => data += c);
    res.on('end', () => {
      console.log('\n=== IPVE Digital Server Status ===');
      console.log('Homepage: ' + res.statusCode + ' (' + data.length + ' bytes)');
      console.log('Contains IPVE: ' + data.includes('IPVE'));
      console.log('Contains _next scripts: ' + data.includes('_next'));
      
      // Extract title
      const titleMatch = data.match(/<title>(.*?)<\/title>/);
      console.log('Title: ' + (titleMatch ? titleMatch[1] : 'N/A'));
      
      console.log('\nServer is running on http://0.0.0.0:3000');
      console.log('Press Ctrl+C to stop.\n');
      
      // Keep alive - test every 30s
      setInterval(() => {
        http.get('http://127.0.0.1:3000/api/health', (r) => {
          console.log(new Date().toLocaleTimeString() + ' - Health check: ' + r.statusCode);
        }).on('error', () => {
          console.log(new Date().toLocaleTimeString() + ' - Health check FAILED');
        });
      }, 30000);
    });
  }).on('error', (e) => {
    console.log('Connection error: ' + e.message);
    console.log('Server may need a moment to start...');
  });
}, 2000);
