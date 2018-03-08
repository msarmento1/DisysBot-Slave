
const performCommand = require('../../../protocol/dwp/pdu/perform_command')
const stateManager = require('../../manager/state_manager')
const taskManager = require('../../manager/task_manager')

module.exports.execute = function (pdu, socket) {
  stateManager.handleCommand(pdu.command)
}