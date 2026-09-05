import { app } from './app.js';
import { config } from './config/index.js';

const server = app.listen(config.port, () => {
  console.log(`🚀 Mortgage Tracker Backend running on port ${config.port} (${config.env})`);
  console.log(`📡 API endpoint: http://localhost:${config.port}/api`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});
