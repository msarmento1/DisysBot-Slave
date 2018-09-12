
const stateManager = require('../../manager/state_manager');

module.exports.execute = (pdu, socket) => { // eslint-disable-line no-unused-vars
  stateManager.handleCommand(pdu.command);
};
