const http = require('http');

function postForm(url, fields) {
  return new Promise((resolve, reject) => {
    const postData = Object.entries(fields)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join('&');

    const options = {
      hostname: 'localhost',
      port: 8000,
      path: url,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 400) {
          reject(new Error(`Status ${res.statusCode}: ${data}`));
        } else {
          resolve(JSON.parse(data));
        }
      });
    });

    req.on('error', (e) => reject(e));
    req.write(postData);
    req.end();
  });
}

function getRawJson(url, token) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 8000,
      path: url,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 400) {
          reject(new Error(`Status ${res.statusCode}: ${data}`));
        } else {
          resolve(data);
        }
      });
    });

    req.on('error', (e) => reject(e));
    req.end();
  });
}

async function main() {
  try {
    const loginRes = await postForm('/api/v1/auth/login', {
      username: 'admin@arregui.com',
      password: 'arregui2026'
    });
    const token = loginRes.access_token;
    console.log("Logged in successfully!");

    const raw = await getRawJson('/api/v1/services/events', token);
    const parsed = JSON.parse(raw);
    const planning = parsed.filter(e => e.company === 'Planificación');
    
    // Print first detail keys
    if (planning.length > 0 && planning[0].details && planning[0].details.length > 0) {
      console.log("Keys in detail object:", Object.keys(planning[0].details[0]));
      console.log("Raw detail object:", planning[0].details[0]);
    } else {
      console.log("No planning details found");
    }

  } catch (err) {
    console.error("Error:", err.message);
  }
}

main();
