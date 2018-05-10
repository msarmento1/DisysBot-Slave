/*
 *
 * Copyright (c) 2017 Matheus Medeiros Sarmento
 *
 */

const { exec } = require('child_process');

const tasks = [];

module.exports.exec = (commandLine, id, options, callback) => {
  const childProcess = exec(commandLine, options, (err, stdout, stderr) => {
    let killed = false;

    for (let idx = 0; idx < tasks.length; idx += 1) {
      if (tasks[idx].pid === childProcess.pid) {
        killed = tasks[idx].killed; // eslint-disable-line
        tasks.splice(idx, 1);
        break;
      }
    }

    callback(id, killed, err, stdout, stderr);
  });

  tasks.push({
    id,
    pid: childProcess.pid,
    killed: false
  });
};

module.exports.getTaskIds = () => {
  const taskIds = [];

  tasks.forEach((task) => {
    taskIds.push(task.id);
  });

  return taskIds;
};

/**
* @param id process second identification (this is not the PID)
*/
module.exports.kill = (id) => {
  let pid;

  for (let idx = 0; idx < tasks.length; idx += 1) {
    if (tasks[idx].id === id) {
      pid = tasks[idx].pid; // eslint-disable-line
      tasks[idx].killed = true;
    }
  }

  if (pid !== undefined) {
    process.kill(pid);
  }
};

module.exports.killAll = () => {
  for (let idx = 0; idx < tasks.length; idx += 1) {
    tasks[idx].killed = true;
    process.kill(tasks[idx].pid);
  }
};
