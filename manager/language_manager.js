const config = require('../configuration').getConfiguration();

module.exports.init = () => {
}

/**
 * Returns languages supported by the worker.
 * @return {Array} - Objects representing languages with the properties
 * 'name' and also possibly 'command' and 'version', if they are defined on runtime.
 */
module.exports.getSupportedLanguages = () => {
  return config.languages.objectList;
}
