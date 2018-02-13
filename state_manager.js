////////////////////////////////////////////////
//
// Copyright (c) 2017 Matheus Medeiros Sarmento
//
////////////////////////////////////////////////

const Command = require( '../protocol/dwp/pdu/control_command' ).Command;
const processManager = require( './process_manager' );
const EventEmitter = require( 'events' );
const WorkerState = require( '../protocol/dwp/common' ).WorkerState;

var state = WorkerState.Executing;

var event = new EventEmitter();

function handleCommand( command ) {

   switch ( command ) {

      case Command.Pause:
         if ( state === WorkerState.Paused ) {
            return;
         }

         console.log( 'Pausing' );

         state = WorkerState.Paused;

         processManager.killAll();

         event.emit( 'pause' );

         break;

      case Command.Resume:
         if ( state === WorkerState.Executing ) {
            return;
         }

         console.log( 'Resuming' );

         state = WorkerState.Executing;

         break;

      case Command.Stop:

         console.log( 'Stopping' );

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
   event,
   handleCommand,
   getCurrentState
}