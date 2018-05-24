
const extend = require('util')._extend;

const config = require('../../configuration').getConfiguration();
const resource = require('./../../resource');
const stateManager = require('./../../manager/state_manager');
const taskManager = require('./../../manager/task_manager');
const languageManager = require('./../../manager/language_manager');

const report = require('../../../protocol/dwp/pdu/report');
const { Flags } = require('../../../protocol/dwp/common');

module.exports.execute = (pdu, socket) => {
  resource.getCpuUsage((cpuUsage) => {
    let packet = { flags: pdu.flags };

    if (pdu.flags & Flags.RESOURCE) {
      packet = extend(packet, {
        resource: {
          cpu: 1 - cpuUsage,
          memory: resource.getAvailableMemory()
        }
      });
    }

    if (pdu.flags & Flags.STATE) {
      packet = extend(packet, {
        state: stateManager.getCurrentState()
      });
    }

    if (pdu.flags & Flags.TASKS) {
      packet = extend(packet, {
        tasks: taskManager.getTaskIds()
      });
    }

    if (pdu.flags & Flags.ALIAS) {
      packet = extend(packet, {
        alias: config.alias
      });
    }

    if (pdu.flags & Flags.SUPPORTED_LANGUAGES) {
      packet = extend(packet, {
        languages: languageManager.getSupportedLanguages()
      });
    }

    socket.write(report.format(packet));
  });
};
