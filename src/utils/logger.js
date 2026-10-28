function log(message, ...args) {
  console.log(`[Player] ${message}`, ...args);
}

function info(message, ...args) {
  console.info(`[Player] ${message}`, ...args);
}

function warn(message, ...args) {
  console.warn(`[Player] ${message}`, ...args);
}

function error(message, ...args) {
  console.error(`[Player] ${message}`, ...args);
}

export const logger = {
  log,
  info,
  warn,
  error,
};
