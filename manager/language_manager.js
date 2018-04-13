const logger = require('../logger');
const config = require('../configuration').getConfiguration();
const getLanguageCommand = require('../../protocol/dwp/pdu/get_language_command')

module.exports.init = (socket) => {
  var packet = {
    names: config.languages.list
  }

  logger.debug('Requesting commands for all languages defined in the config file');
  socket.write(getLanguageCommand.format(packet));
}

/**
 * Returns languages supported by the worker.
 * @return {Array} - Objects representing languages with the properties
 * 'name' and also possibly 'command' and 'version', if they are defined on runtime.
 */
module.exports.getSupportedLanguages = () => {
  return config.languages.objectList;
}
