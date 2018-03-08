////////////////////////////////////////////////
//
// Copyright (c) 2017 Matheus Medeiros Sarmento
//
////////////////////////////////////////////////

const execFile = require('child_process').execFile

var tasks = []

module.exports.exec = function (file, args, id, options, callback) {
  const childProcess = execFile(file, args, options, function (err, stdout, stderr) {

    var killed = false

    for (var idx = 0; idx < tasks.length; ++idx) {

      if (tasks[idx].pid == childProcess.pid) {
        killed = tasks[idx].killed
        tasks.splice(idx, 1)
        break
      }
    }

    callback(id, killed, err, stdout, stderr)
  })

  tasks.push({
    id: id,
    pid: childProcess.pid,
    killed: false
  })
}

module.exports.getTaskIds = function () {

  var taskIds = []

  tasks.forEach(function (task) {
    taskIds.push(task.id)
  })

  return taskIds
}

/**
* @param id process second identification (this is not the PID)
*/
module.exports.kill = function (id) {
  var pid

  for (var idx = 0; idx < tasks.length; ++idx) {
    if (tasks[idx].id === id) {
      pid = tasks[idx].pid
      tasks[idx].killed = true
    }
  }

  if (pid !== undefined) {
    process.kill(pid)
  }
}

module.exports.killAll = function () {
  for (var idx = 0; idx < tasks.length; ++idx) {
    tasks[idx].killed = true
    process.kill(tasks[idx].pid)
  }
}