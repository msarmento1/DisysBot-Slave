
const extend = require('util')._extend

const config = require('../../configuration').getConfiguration();
const resource = require('./../../resource')
const stateManager = require('./../../manager/state_manager')
const taskManager = require('./../../manager/task_manager')

const report = require('../../../protocol/dwp/pdu/report')
const Flags = require('../../../protocol/dwp/common').Flags

module.exports.execute = function (pdu, socket) {
  resource.getCpuUsage(function (cpuUsage) {
    var packet = { flags: pdu.flags }

    if (pdu.flags & Flags.RESOURCE) {
      packet = extend(packet, {
        resource: {
          cpu: 1 - cpuUsage,
          memory: resource.getAvailableMemory()
        }
      })
    }

    if (pdu.flags & Flags.STATE) {
      packet = extend(packet, {
        state: stateManager.getCurrentState()
      })
    }

    if (pdu.flags & Flags.TASKS) {
      packet = extend(packet, {
        tasks: taskManager.getTaskIds()
      })
    }

    if (pdu.flags & Flags.ALIAS) {
      packet = extend(packet, {
        alias: config.alias
      })
    }

    socket.write(report.format(packet))
  })
}