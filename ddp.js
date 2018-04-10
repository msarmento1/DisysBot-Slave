////////////////////////////////////////////////
//
// Copyright (c) 2017 Matheus Medeiros Sarmento
//
////////////////////////////////////////////////

// Dispatcher Discovery Protocol

const dgram = require('dgram');
const EventEmitter = require('events');
const configuration = require('./configuration').getConfiguration();

// Responsible for loggin into console and log file
const logger = require('./logger');

var event = new EventEmitter();

var receivedResponse = false;

const socket = dgram.createSocket('udp4');

function execute() {

  socket.on('listening', () => {

    socket.setBroadcast(true);

    if (configuration.dispatcherAddress !== undefined) {
      logger.debug('Dispatcher address is configured: ' + configuration.dispatcherAddress);
      return event.emit('address', configuration.dispatcherAddress);
    }

    resume();
  });

  socket.on('message', (message, rinfo) => {

    // @TODO: Validate message

    if (!receivedResponse) {
      // Avoid duplicates
      logger.debug('Received response from dispatcher');
      event.emit('address', rinfo.address);
      receivedResponse = true;
    }
  });

  // Bind to any port
  socket.bind();
}

function resume() {

  logger.debug('Trying to discover dispatcher via UDP broadcast');

  send();

  var tries = 0;

  var intervalId = setInterval(() => {

    if (receivedResponse) {
      receivedResponse = false;
      clearInterval(intervalId);
      return;
    }

    if (tries >= 10 && (configuration.DispatcherAddress !== undefined)) {
      logger.debug(tries + ' tries to connect to dispatcher via UDP broadcast. Trying again with address configured');
      tries = 0;
      clearInterval(intervalId);
      return event.emit('dispatcher_address', configuration.DispatcherAddress);
    }

    ++tries;
    send();
  }, 1000);
}

function send() {

  const message = 'NewWorker';

  // Send message and wait for dispatcher's response
  socket.send(message, 0, message.length, 16180, '255.255.255.255');
}

module.exports = {
  execute,
  resume,
  event
}