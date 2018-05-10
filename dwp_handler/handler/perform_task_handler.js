// General
const rimraf = require('rimraf')
const logger = require('../../logger');

// Management Related
const taskManager = require('./../../manager/task_manager')
const stateManager = require('./../../manager/state_manager')
const tempManager = require('./../../manager/temp_manager')

// Protocol Related
const performTaskResponse = require('./../../../protocol/dwp/pdu/perform_task_response')
const taskResult = require('./../../../protocol/dwp/pdu/task_result')

module.exports.execute = function (pdu, socket) {
  if (stateManager.getCurrentState() === stateManager.State.PAUSED) {
    return
  }

  logger.debug('New simulation received!');

  Promise.all(pdu.files.map(function (file) {
    if (file.content.type === 'Buffer') {
      return tempManager.create(pdu.taskId, file.name, Buffer(file.content))
    } else {
      return tempManager.create(pdu.taskId, file.name, file.content)
    }
  })).then(function () {
    socket.write(performTaskResponse.format({ taskId: pdu.taskId, code: performTaskResponse.ReturnCode.EXECUTING }))

    const options = {
      cwd: tempManager.getCWD(pdu.taskId)
    }

    taskManager.exec(pdu.exec.file, pdu.exec.arguments, pdu.taskId, options, function (id, killed, err, stdout, stderr) {
      if (killed) {
        return
      }

      var packet = {
        task: {
          id: undefined
        }
      }

      packet.task.id = pdu.taskId

      if (err) {
        logger.error('Simulation has finished with error.\n' + err);

        packet.code = taskResult.ReturnCode.ERROR
        packet.output = err
      }

      if (stderr) {
        logger.error('Simulation has finished with error.\n' + stderr);

        packet.code = taskResult.ReturnCode.ERROR
        packet.output = stderr
      }

      if (stdout) {
        logger.info('Simulation has finished with success');

        packet.code = taskResult.ReturnCode.SUCCESS
        packet.output = stdout
      }

      socket.write(taskResult.format( packet ))
    })
  }).catch(function (e) {
    logger.err(e)
  })
}