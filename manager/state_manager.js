////////////////////////////////////////////////
//
// Copyright (c) 2017 Matheus Medeiros Sarmento
//
////////////////////////////////////////////////

const Command = require('../../protocol/dwp/pdu/perform_command').Command
const processManager = require('./task_manager');
const EventEmitter = require('events');
const WorkerState = require('../../protocol/dwp/common').WorkerState;

const State = {
  EXECUTING: WorkerState.EXECUTING,
  PAUSED: WorkerState.PAUSED
}

var state = WorkerState.EXECUTING;

function handleCommand(command) {

  switch (command) {
    case Command.PAUSE:
      if (state === WorkerState.Paused) {
        return;
      }

      state = WorkerState.PAUSED;
      processManager.killAll();
      break;

    case Command.RESUME:
      if (state === WorkerState.Executing) {
        return;
      }

      state = WorkerState.EXECUTING;
      break;

    case Command.STOP:
      processManager.killAll();
      process.exit()

    default:
      return;
  }
}

function getCurrentState() {
  return state;
}

module.exports = {
  handleCommand,
  getCurrentState,
  State: State
}