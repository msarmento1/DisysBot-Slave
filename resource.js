////////////////////////////////////////////////
//
// Copyright (c) 2017 Matheus Medeiros Sarmento
//
////////////////////////////////////////////////

const os = require('os');
const os_utils = require('os-utils');
const { exec } = require('child_process');

module.exports.getAvailableMemory = function () {
   return os.freemem() / os.totalmem();
}

module.exports.getCpuUsage = function ( callback ) {
   os_utils.cpuUsage( callback );
}

module.exports.execAsync = (command, options = {}) => {
    const promise = new Promise((resolve, reject) => {
        exec(command, options, (err, stdout, stderr) => {
            if (err) reject(err);
            else resolve({
                stdout,
                stderr
            });
        });
    });
    return promise;
}
