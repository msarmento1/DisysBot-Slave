// General
const parseDataUrl = require('parse-data-url');
const logger = require('../../logger');

// Management Related
const taskManager = require('./../../manager/task_manager');
const stateManager = require('./../../manager/state_manager');
const tempManager = require('./../../manager/temp_manager');

// Protocol Related
const performTaskResponse = require('./../../../protocol/dwp/pdu/perform_task_response');
const taskResult = require('./../../../protocol/dwp/pdu/task_result');

module.exports.execute = (pdu, socket) => {
  if (stateManager.getCurrentState() === stateManager.State.PAUSED) {
    return undefined;
  }

  logger.debug('New task received!');

  try {
    return Promise
      .all(pdu.files.map((file) => {
        const parsed = parseDataUrl(file.dataURL);
        return tempManager.create(pdu.task.id, file.name, parsed.toBuffer());
      }))
      .then(() => {
        socket.write(performTaskResponse.format({
          task: pdu.task,
          code: performTaskResponse.ReturnCode.EXECUTING
        }));

        const options = {
          cwd: tempManager.getCWD(pdu.task.id)
        };

        taskManager.exec(
          pdu.commandLine, pdu.task.id, options,
          (id, killed, err, stdout, stderr) => {
            tempManager.delete(id);
            if (killed) {
              return undefined;
            }

            const packet = {
              task: {
                id: undefined
              }
            };

            packet.task = pdu.task;

            if (err) {
              logger.error(`Simulation has finished with error.\n${err}`);

              packet.code = taskResult.ReturnCode.ERROR;
              packet.output = err;
            }

            if (stderr) {
              logger.error(`Simulation has finished with error.\n${stderr}`);

              packet.code = taskResult.ReturnCode.ERROR;
              packet.output = stderr;
            }

            if (stdout) {
              logger.info('Simulation has finished with success');

              packet.code = taskResult.ReturnCode.SUCCESS;
              packet.output = stdout;
            }

            return socket.write(taskResult.format(packet));
          }
        );
      })
      .catch((e) => {
        logger.error(e);
      });
  } catch (e) {
    logger.error(e);
    return undefined;
  }
};
