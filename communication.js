////////////////////////////////////////////////
//
// Copyright (c) 2017 Matheus Medeiros Sarmento
//
////////////////////////////////////////////////

// General Requirements
const net = require('net');
const logger = require('./logger');

const EventEmitter = require('events')
var event = new EventEmitter()
module.exports.event = event

// DWP Handler Related
const dwpManager = require('./dwp_handler/manager')

// Require to init and check existing languages
const languageManager = require('./manager/language_manager')

// DDP Related
const ddp = require('./ddp')

// Protocol Related
const factory = require('../protocol/dwp/factory')

var socket = new net.Socket();

module.exports.execute = function () {
  ddp.event.on('address', function (address) {
    var buffer = '';

    logger.debug('Trying to connect to ' + address + ':16180');

    socket = net.createConnection({ host: address, port: 16180 }, function () {
      logger.debug('TCP connection established');
      languageManager.init(socket);
    });

    socket.on('data', function (data) {
      buffer += data;

      var packet;
      try {
        do {
          // This may throw an exception
          packet = factory.expose(buffer)

          // This may throw an exception
          buffer = factory.remove(buffer)

          dwpManager.treat(packet, socket)
        } while (buffer.length !== 0)
      } catch (e) {
        // It is normal to end up here
        // Do not treat exception!
      }
    });

    socket.on('error', function (err) {
      socket.destroy();

      if (err.code) {
        logger.warn(err.code);
      }
    });

    socket.on('close', function () {
      logger.warn('Dispatcher connection closed!');
      ddp.resume();
    });

    socket.on('timeout', function () {
      logger.warn('Socket timed out! Closing connection');
      socket.destroy();
    });
  });
}