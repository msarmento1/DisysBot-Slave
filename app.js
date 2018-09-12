global.protocolRequire = (name) => {
   return require(`${__dirname}/DisysBot-Protocol/${name}`);
};

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
