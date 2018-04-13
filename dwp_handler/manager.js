
// General Requirements
const logger = require('../logger');

// Protocol Related
const factory = require('../../protocol/dwp/factory')
const Id = require('../../protocol/dwp/factory').Id

// DWP Handler Related
const getReportHandler = require('./handler/get_report_handler')
const performTaskHandler = require('./handler/perform_task_handler')
const terminateTaskHandler = require('./handler/terminate_task_handler')
const performCommandHandler = require('./handler/perform_command_handler')
const languageManager = require('../manager/language_manager')

module.exports.treat = function (packet, socket) {
  var pdu

  try {
    pdu = JSON.parse(packet.toString())
    factory.validate(pdu)
  } catch (e) {
    return logger.fatal(e)
  }

  chooseHandler(pdu, socket)
}

function chooseHandler(pdu, socket) {
  switch (pdu.header.id) {
    case Id.GET_REPORT:
      getReportHandler.execute(pdu, socket)
      break

    case Id.PERFORM_TASK:
      performTaskHandler.execute(pdu, socket)
      break

    case Id.TERMINATE_TASK:
      terminateTaskHandler.execute(pdu, socket)
      break

    case Id.PERFORM_COMMAND:
      performCommandHandler.execute(pdu, socket)
      break

    case Id.LANGUAGE_COMMAND:
      languageManager.testLanguages(pdu)
      break
  }
}