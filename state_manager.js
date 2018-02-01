////////////////////////////////////////////////
//
// Copyright (c) 2017 Matheus Medeiros Sarmento
//
////////////////////////////////////////////////

const Command = require( '../protocol/dwp/pdu/control_command' ).Command;
const processManager = require( './process_manager' );

const State = {
   Executing = 0,
   Paused = 1,
};

module.exports.State = State;

var state = State.Executing;

var event = new EventEmitter();

module.exports.handleCommand = function ( command ) {

   switch ( command ) {

      case Command.Pause:

         if ( state === State.Paused ) {
            return;
         }

         state = State.Paused;

         processManager.killAll();

         event.emit( 'pause' );

         break;

      case Command.Resume:

         if ( state === State.Executing ) {
            return;
         }

         state = State.Executing;

         break;

      case Command.Stop:

         processManager.killAll();

         process.exit()

      default:
         return;
   }
}

module.exports.getCurrentState = function () {
   return state;
}