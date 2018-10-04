/*
 *
 * Copyright (c) 2017 Matheus Medeiros Sarmento
 *
 */

const processManager = require('./task_manager');
const { Command } = protocolRequire('dwp/pdu/perform_command');
const { SlaveState } = protocolRequire('dwp/common');

const State = {
  EXECUTING: SlaveState.EXECUTING,
  PAUSED: SlaveState.PAUSED
};

let state = SlaveState.EXECUTING;

function handleCommand(command) {
  switch (command) {
    case Command.PAUSE:
      if (state === SlaveState.Paused) {
        return;
      }

      state = SlaveState.PAUSED;
      processManager.killAll();
      break;

    case Command.RESUME:
      if (state === SlaveState.Executing) {
        return;
      }

      state = SlaveState.EXECUTING;
      break;

    case Command.STOP:
      processManager.killAll();
      process.exit();
      break;

    default:
  }
}

function getCurrentState() {
  return state;
}

module.exports = {
  handleCommand,
  getCurrentState,
  State
};
