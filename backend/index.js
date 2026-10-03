// Application entry point (`npm start`). Order matters: validate configuration, connect to
// MongoDB, and only then start accepting traffic.
const { getConfig, ConfigError } = require('./config/env');
const storage = require('./services/storage');
const { connectDatabase, disconnectDatabase } = require('./config/db');
const { createApp } = require('./app');

const SHUTDOWN_TIMEOUT_MS = 10000;

const main = async () => {
  let config;
  try {
    config = getConfig();
  } catch (err) {
    console.error(err instanceof ConfigError ? err.message : `Failed to load configuration: ${err.message}`);
    process.exit(1);
  }

  config.warnings.forEach((warning) => console.warn(`[config] ${warning}`));
  storage.init(config);

  try {
    await connectDatabase(config);
  } catch (err) {
    console.error(`[db] Could not connect to MongoDB: ${err.message}`);
    console.error('[db] Check MONGODB_URI, the database user/password, and the Atlas Network Access list.');
    process.exit(1);
  }

  const app = createApp(config);
  const server = app.listen(config.port, () => {
    console.info(`[server] Listening on port ${config.port} (${config.nodeEnv}, storage: ${config.storageDriver})`);
  });
  // Keep-alive above the load balancer's idle timeout avoids sporadic 502s.
  server.keepAliveTimeout = 65000;
  server.headersTimeout = 66000;

  let shuttingDown = false;
  const shutdown = async (signal) => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.info(`[server] ${signal} received, shutting down`);
    const forceExit = setTimeout(() => process.exit(1), SHUTDOWN_TIMEOUT_MS);
    forceExit.unref();
    server.close(async () => {
      try {
        await disconnectDatabase();
      } finally {
        process.exit(0);
      }
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('unhandledRejection', (reason) => console.error('[process] Unhandled rejection:', reason));
};

main();
