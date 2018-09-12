const logger = require('../logger');
const config = require('../configuration').getConfiguration();
const { execAsync } = require('../resource');
const getLanguageCommand = protocolRequire('dwp/pdu/get_language_command');
const languageSupport = protocolRequire('dwp/pdu/language_support');

module.exports.init = (socket) => {
  const packet = {
    names: config.languages.list
  };

  logger.debug('Requesting commands for all languages defined in the config file');
  socket.write(getLanguageCommand.format(packet));
};

module.exports.testLanguages = async (pdu) => {
  const { languages } = pdu;

  logger.debug('Executing tests for each language listed on config file');
  const { length } = languages;
  for (let i = 0; i < length; i += 1) {
    const languageName = languages[i].name;
    config.languages.map[languageName] = await executeLanguageTest(languages[i]); // eslint-disable-line

    if (config.languages.map[languageName].works) {
      logger.debug(`Test of language '${languageName}' succeeded`);
    } else {
      logger.error(`Test of language '${languageName}' failed`);
    }
  }
};

/**
 * Executes the command defined in language and check whether it succeeds.
 */
const executeLanguageTest = async (language) => {
  const languageObject = {
    command: language.command,
    works: false,
    version: undefined
  };
  // If dispatcher did not return a command to this language
  if (language.command === undefined) {
    return languageObject;
  }

  try {
    const { stdout, stderr } = await execAsync(language.command, { timeout: 5000 });
    languageObject.works = true;
    languageObject.version = stderr.length > stdout.length ? stderr : stdout;
  } catch (err) {
    // empty
  }

  return languageObject;
};

module.exports.getLanguageSupport = async (pdu, socket) => {
  const packet = {
    name: pdu.name,
    allow: false,
    version: undefined
  };

  const { map } = config.languages;

  if (map[pdu.name] !== undefined) {
    packet.version = map[pdu.name].version;
    packet.allow = map[pdu.name].works;
  } else if (config.languages.allow_others) {
    try {
      const testedLanguage = await executeLanguageTest(pdu);
      map[pdu.name] = testedLanguage;
      packet.version = testedLanguage.version;
      packet.allow = testedLanguage.works;
    } catch (err) {
      logger.error(err);
    }
  }
  socket.write(languageSupport.format(packet));
};

/**
 * Returns languages supported by the worker.
 * @return {Array} - Objects representing languages with the properties
 * 'name' and also possibly 'command' and 'version', if they are defined on runtime.
 */
module.exports.getSupportedLanguages = () => {
  const { map } = config.languages;
  const supportedLanguages = [];
  for (let key in map) { // eslint-disable-line
    // check if the property/key is defined in the object itself, not in parent
    if (!map.hasOwnProperty(key)) continue; // eslint-disable-line
    const details = map[key];

    supportedLanguages.push({
      name: key,
      version: details.version,
      command: details.command,
      works: details.works
    });
  }
  return supportedLanguages;
};
