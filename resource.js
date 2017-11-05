////////////////////////////////////////////////
//
// Copyright (c) 2017 Matheus Medeiros Sarmento
//
////////////////////////////////////////////////

const os = require( 'os' );
const os_utils = require( 'os-utils' )

module.exports.getAvailableMemory = function () {
   return os.freemem() / os.totalmem();
}

module.exports.getCpuUsage = function ( callback ) {
   os_utils.cpuUsage( callback );
}