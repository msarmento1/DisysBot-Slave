////////////////////////////////////////////////
//
// Copyright (c) 2017 Matheus Medeiros Sarmento
//
////////////////////////////////////////////////

const execFile = require( 'child_process' ).execFile;

var processes = [];

module.exports.exec = function ( file, args, id, callback ) {

   const childProcess = execFile( file, args, function ( err, stdout, stderr ) {

      var killed = false;

      for ( var idx = 0; idx < processes.length; ++idx ) {

         if ( processes[idx].pid == childProcess.pid ) {
            killed = processes[idx].killed;
            processes.splice( idx, 1 );
            break;
         }
      }

      callback( id, killed, err, stdout, stderr );
   } );

   processes.push( {
      'id': id,
      'pid': childProcess.pid,
      'killed': false
   } );
}

/**
* @param id process second identification (this is not the PID)
*/
module.exports.kill = function ( id ) {

   var pid;

   for ( var idx = 0; idx < processes.length; ++idx ) {
      if ( processes[idx].id === id ) {
         pid = processes[idx].pid;
         processes[idx].killed = true;
      }
   }

   if ( pid !== undefined ) {
      process.kill( pid );
   }
}

module.exports.killAll = function () {

   for ( var idx = 0; idx < processes.length; ++idx ) {
      process.kill( processes[idx].pid );
   }
}