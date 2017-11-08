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
const execFile = require( 'child_process' ).execFile;
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
}

function treat ( data ) {

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

               var child = execFile( 'java', arguments, ( err, stdout, stderr ) => {

                  var simulationId;

                  var killed = false;

                  for ( var idx = 0; idx < simulationPID.length; ++idx ) {

                     if ( simulationPID[idx].PID == child.pid ) {

                        simulationId = simulationPID[idx].SimulationId;
                        var killed = simulationPID[idx].killed;
                        simulationPID.splice( idx, 1 );
                        executingSimulationInstances.splice( idx, 1 );

                        break;
                     }
                  }

                  if ( killed ) {
                     logger.debug( 'Process was killed by dispatcher' );

                     rimraf( path, ( err ) => {

                        if ( err ) {
                           return logger.error( err );
                        }

                     } );

                     return;
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

                  dwSocket.write( simulation_response.format( data ) );

                  rimraf( path, ( err ) => {

                     if ( err ) {
                        return logger.error( err );
                     }

                  } );
               } );

               simulationPID.push( {
                  'SimulationId': object.Data._id,
                  'PID': child.pid,
                  'killed': false
               } );

               executingSimulationInstances.push( {
                  'id': object.Data._id,
                  'startTime': object.Data.startTime
               } );

            } );
         } );

         break;

      case factory.Id.ReportRequest:

         logger.debug( JSON.stringify( executingSimulationInstances ) );

         // Respond dispatcher
         dwSocket.write( reportResponse.format( { report: executingSimulationInstances } ) );

         break;

      case factory.Id.SimulationTerminateRequest:

         var pid;

         for ( var idx = 0; idx < simulationPID.length; ++idx ) {
            if ( simulationPID[idx].SimulationId == object.SimulationId ) {
               pid = simulationPID[idx].PID;
               simulationPID[idx].killed = true;
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

function writeFile ( path, contents, callback ) {

   mkdirp( dirname( path ), ( err ) => {
      if ( err ) {
         return callback( err );
      }

      fs.writeFile( path, contents, callback );
   } );
}