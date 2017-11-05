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
const fs = require( 'fs' );
const mkdirp = require( 'mkdirp' );
const dirname = require( 'path' ).dirname;
const exec = require( 'child_process' ).exec;
const rimraf = require( 'rimraf' );

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

var simulationPID = [];

module.exports = function () {

   // Remove from local cache
   ddp.event.on( 'dispatcher_address', function ( dispatcherAddress ) {

      var buffer = '';

      logger.debug( 'Trying to connect to ' + dispatcherAddress + ':16180' );
      // TCP socket in which all the communication dispatcher-workers will be accomplished
      var socket = new net.Socket();

      socket.connect( 16180, dispatcherAddress, function () {
         logger.debug( 'Connection established' );
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
         if ( err.code ) {
            logger.warn( err.code );
         }
      } );

      socket.on( 'close', function () {
         logger.warn( 'Dispatcher connection closed!' );
         ddp.resume();
      } );

   } );
}

function treat( data, socket ) {

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

         resource.getCpuUsage(( cpuUsage ) => {
            var data = { cpu: ( 1 - cpuUsage ), memory: resource.getAvailableMemory() };

            // Respond dispatcher
            socket.write( resource_response.format( data ) );
         } );

         break;

      case factory.Id.SimulationRequest:

         logger.debug( 'New simulation received!' );

         const path = __dirname + '/' + object.Data._id + '/';
         const binaryContent = Buffer( object.Data._simulation._binary.content );
         const documentContent = object.Data._simulation._document.content;

         writeFile( path + object.Data._simulation._binary.name, binaryContent, ( err ) => {
            if ( err ) throw err;

            writeFile( path + object.Data._simulation._document.name, documentContent, ( err ) => {
               if ( err ) throw err;

               var command = 'java -jar ';
               command += path + object.Data._simulation._binary.name + ' ';
               command += path + object.Data._simulation._document.name + ' ';
               command += object.Data.seed + ' ';
               command += object.Data.load + ' ';
               command += object.Data.load + ' 1';

               command = command.replace( /\\/g, '/' );

               var child = exec( command, ( err, stdout, stderr ) => {

                  var simulationId;

                  for ( var idx = 0; idx < simulationPID.length; ++idx ) {

                     if ( simulationPID[idx].PID == child.pid ) {

                        simulationId = simulationPID[idx].SimulationId;
                        simulationPID.splice( idx, 1 );

                        break;
                     }
                  }

                  var data = {};

                  data.SimulationId = simulationId;

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

                  socket.write( simulation_response.format( data ) );

                  rimraf( path, ( err ) => {

                     if ( err ) {
                        return logger.error( err );
                     }
                  } );
               } );

               simulationPID.push( {
                  'SimulationId': object.Data._id,
                  'PID': child.pid,
               } );
            } );
         } );

         break;

      case factory.Id.SimulationTerminateRequest:
         var pid;

         for ( var idx = 0; idx < simulationPID.length; ++idx ) {
            if ( simulationPID[idx].SimulationId == object.SimulationId ) {
               pid = simulationPID[idx].PID;
            }
         }

         if ( pid !== undefined ) {
            process.kill( pid );
         }

         break;

      default:
         return logger.error( 'Invalid Id!' );
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