
const performCommand = require('../../../protocol/dwp/pdu/perform_command'); // eslint-disable-line no-unused-vars
const stateManager = require('../../manager/state_manager');
const taskManager = require('../../manager/task_manager'); // eslint-disable-line no-unused-vars

module.exports.execute = (pdu, socket) => { // eslint-disable-line no-unused-vars
  stateManager.handleCommand(pdu.command);
};
