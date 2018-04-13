const { exec } = require('child_process');
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

module.exports.testLanguages = (pdu) => {
  const languages = pdu.languages;

  logger.debug('Executing tests for each language listed on config file');
  for (let i in languages) {
    executeLanguageTest(languages[i]);
  }
}

/**
 * Executes the command defined in language and check whether it succeeds.
 */
const executeLanguageTest = (language) => {
  // If dispatcher did not return a command to this language
  if (language.command === undefined) {
    logger.error(`Test of language '${language.name}' failed`);
    config.languages.map[language.name] = {
      command: language.command,
      works: false,
      version: undefined
    }
    return;
  }

  exec(language.command, (err, stdout, stderr) => {
    if (err) {
      logger.error(`Test of language '${language.name}' failed`);
      config.languages.map[language.name] = {
        command: language.command,
        works: false,
        version: undefined
      }
      return;
    }

    logger.debug(`Test of language '${language.name}' succeeded`);
    config.languages.map[language.name] = {
      command: language.command,
      works: true,
      version: stderr
    }
  });
}

/**
 * Returns languages supported by the worker.
 * @return {Array} - Objects representing languages with the properties
 * 'name' and also possibly 'command' and 'version', if they are defined on runtime.
 */
module.exports.getSupportedLanguages = () => {
  const map = config.languages.map;
  const supportedLanguages = [];
  for (let key in map) {
    // check if the property/key is defined in the object itself, not in parent
    if (!map.hasOwnProperty(key)) continue;
    const details = map[key];

    supportedLanguages.push({
      name: key,
      version: details.version,
      command: details.command,
      works: details.works
    });
  }
  return supportedLanguages;
}
