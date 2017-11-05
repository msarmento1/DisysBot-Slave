////////////////////////////////////////////////
//
// Copyright (c) 2017 Matheus Medeiros Sarmento
//
////////////////////////////////////////////////

'use strict';

const ddp = require( './ddp' );
const communication = require( './communication' );
const log4js = require( 'log4js' );

log4js.configure( {
   appenders: {
      out: { type: 'stdout' },
      app: { type: 'file', filename: 'log/app.log' }
   },
   categories: {
      default: { appenders: ['out', 'app'], level: 'debug' }
   }
} );

var logger = log4js.getLogger();

try {
   ddp.execute();
   communication();
} catch ( err ) {
   // Unhandled catch
   logger.error( err );
}
