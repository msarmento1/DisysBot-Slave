////////////////////////////////////////////////
//
// Copyright (c) 2017 Matheus Medeiros Sarmento
//
////////////////////////////////////////////////

'use strict';

const ddp = require('./ddp');
const communication = require('./communication');
const log4js = require('log4js');

const tempManager = require('./manager/temp_manager');

log4js.configure({
  appenders: {
    out: { type: 'stdout' },
    app: { type: 'file', filename: 'log/app.log' }
  },
  categories: {
    default: { appenders: ['out', 'app'], level: 'debug' }
  }
});

var logger = log4js.getLogger();

try {
  tempManager.clean()
  ddp.execute();
  communication.execute();
} catch (err) {
  // Unhandled catch
  logger.error(err);
}
