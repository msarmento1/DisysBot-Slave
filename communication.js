////////////////////////////////////////////////
//
// Copyright (c) 2017 Matheus Medeiros Sarmento
//
////////////////////////////////////////////////

const net = require( 'net' );
const log4js = require( 'log4js' );
const ddp = require( './ddp' )
const factory = require( '../protocol/dwp/factory' )
const resource = require( './resource' )
const resource_response = require( '../protocol/dwp/pdu/resource_response' )
const simulation_response = require( '../protocol/dwp/pdu/simulation_response' )
const reportResponse = require( '../protocol/dwp/pdu/report_response' );
const fs = require( 'fs' );
const mkdirp = require( 'mkdirp' );
const dirname = require( 'path' ).dirname;
const stateManager = require( './state_manager' );

const rimraf = require( 'rimraf' );
const processManager = require( './process_manager' );

log4js.configure( {
   appenders: {
      out: { type: 'stdout' },
      app: { type: 'file', filename: 'log/communication.log' }
   },
   categories: {
      default: { appenders: ['out', 'app'], level: 'debug' }
   }
} );

// Responsible for loggin into console and log file
const logger = log4js.getLogger();

var executingSimulationInstances = [];
var simulationPID = [];

// Points to dispatcher socket. If socket is closed and
// a new one is opened, it points to the newer one
var dwSocket = new net.Socket();

module.exports = function () {

   // Remove from local cache
   ddp.event.on( 'dispatcher_address', function ( dispatcherAddress ) {

      var buffer = '';

      logger.debug( 'Trying to connect to ' + dispatcherAddress + ':16180' );
      // TCP socket in which all the communication dispatcher-workers will be accomplished

      var socket = new net.Socket();
      socket.setTimeout( 60000 );

      socket.connect( 16180, dispatcherAddress, function () {
         logger.debug( 'TCP connection established' );
      } );

      socket.on( 'data', function ( data ) {
         // Treat chunk data
         buffer += data;

         var packet;
         try {
            do {
               packet = factory.expose( buffer );
               buffer = factory.remove( buffer );
               treat( packet, socket );
            } while ( buffer.length !== 0 )
         } catch ( e ) {
            return;
         }
      } );

      socket.on( 'error', function ( err ) {

         socket.destroy();

         if ( err.code ) {
            logger.warn( err.code );
         }
      } );

      socket.on( 'close', function () {
         logger.warn( 'Dispatcher connection closed!' );
         ddp.resume();
      } );

      socket.on( 'timeout', function () {
         logger.warn( 'Socket timed out! Closing connection' );
         socket.destroy();
      } );

      dwSocket = socket;

   } );

   stateManager.on( 'pause', function () {
      executingSimulationInstances = [];
   } );
}

function treat( data ) {

   var object;

   try {
      object = JSON.parse( data )
      factory.validate( object );
   } catch ( err ) {
      return logger.error( err );
   }

   const id = Number( object.Id );

   switch ( id ) {

      case factory.Id.ResourceRequest:

         resource.getCpuUsage( function ( cpuUsage ) {
            var data = { cpu: ( 1 - cpuUsage ), memory: resource.getAvailableMemory() };

            // Respond dispatcher
            dwSocket.write( resource_response.format( data ) );
         } );

         break;

      case factory.Id.SimulationRequest:

         if ( stateManager.getCurrentState() === stateManager.State.Paused ) {
            break;
         }

         logger.debug( 'New simulation received!' );

         const path = __dirname + '/' + object.Data._id + '/';
         const binaryContent = Buffer( object.Data._simulation._binary.content );
         const documentContent = object.Data._simulation._document.content;

         writeFile( path + object.Data._simulation._binary.name, binaryContent, ( err ) => {
            if ( err ) throw err;

            writeFile( path + object.Data._simulation._document.name, documentContent, ( err ) => {
               if ( err ) throw err;

               var arguments = [];
               arguments.push( '-jar' );
               arguments.push( path + object.Data._simulation._binary.name );
               arguments.push( path + object.Data._simulation._document.name );
               arguments.push( object.Data.seed );
               arguments.push( object.Data.load );
               arguments.push( object.Data.load );
               arguments.push( 1 );

               processManager.exec( 'java', arguments, object.Data._id, function ( id, killed, err, stdout, stderr ) {

                  rimraf( path, function ( err ) {

                     if ( err ) {
                        logger.error( err );
                     }

                  } );

                  for ( var idx = 0; idx < executingSimulationInstances.length; ++idx ) {

                     if ( executingSimulationInstances[idx].id === id ) {
                        executingSimulationInstances.splice( idx, 1 );
                        break;
                     }
                  }

                  if ( killed ) {
                     return;
                  }

                  var data = {};

                  data.SimulationId = id;

                  logger.debug( id );

                  if ( err ) {
                     logger.error( 'Simulation has finished with error.\n' + err );

                     data.Result = simulation_response.Result.Failure;
                     data.ErrorMessage = err;
                  }

                  if ( stderr ) {
                     logger.error( 'Simulation has finished with error.\n' + stderr );

                     data.Result = simulation_response.Result.Failure;
                     data.ErrorMessage = stderr;
                  }

                  if ( stdout ) {
                     logger.info( 'Simulation has finished with success' );

                     data.Result = simulation_response.Result.Success;
                     data.Output = stdout;
                     // Treat simulator output
                  }

                  dwSocket.write( simulation_response.format( data ) );

               } );

               executingSimulationInstances.push( {
                  'id': object.Data._id,
                  'startTime': object.Data.startTime
               } );

            } );
         } );

         break;

      case factory.Id.ReportRequest:

         // Respond dispatcher
         dwSocket.write( reportResponse.format( { report: executingSimulationInstances } ) );

         break;

      case factory.Id.SimulationTerminateRequest:

         processManager.kill( object.SimulationId );

         break;

      case factory.Id.ControlCommand:

         stateManager.handleCommand( object.command );

         break;

      default:
         return logger.error( 'Invalid Id!' + id );
   }
}

function writeFile( path, contents, callback ) {

   mkdirp( dirname( path ), ( err ) => {
      if ( err ) {
         return callback( err );
      }

      fs.writeFile( path, contents, callback );
   } );
}
