/**
 * DEBUG VERSION OF SERVER
 * Catches all errors for debugging
 */

process.on('uncaughtException', (error) => {
  console.error('❌ UNCAUGHT EXCEPTION:', error);
  console.error(error.stack);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ UNHANDLED REJECTION at:', promise);
  console.error('Reason:', reason);
});

try {
  require('./server.js');
} catch (error) {
  console.error('❌ SERVER START ERROR:', error);
  console.error(error.stack);
}
