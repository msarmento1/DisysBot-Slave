/*
 *
 * Copyright (c) 2017 Matheus Medeiros Sarmento
 *
 */

const ddp = require('./ddp');
const communication = require('./communication');
const logger = require('./logger');

const tempManager = require('./manager/temp_manager');

try {
  tempManager.clean();
  ddp.execute();
  communication.execute();
} catch (err) {
  // Unhandled catch
  logger.error(err);
}
