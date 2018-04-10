////////////////////////////////////////////////
//
// Copyright (c) 2017 Matheus Medeiros Sarmento
//
////////////////////////////////////////////////

const fs = require('fs');
const validateIP = require('validate-ip-node');
const logger = require('./logger');

let configuration = {};

load();

module.exports.getConfiguration = () => {

  if (Object.keys( configuration ).length === 0 && configuration.constructor === Object) {
    load();
  }

  return configuration;
}

function load() {

  try {
    configuration = JSON.parse(fs.readFileSync(`${__dirname}/config/config.json`, 'utf8' ).replace( /^\uFEFF/, ''));
  } catch (err) {
    logger.error("Error while loading configuration files, treating everything as default");
  }

  treatDefaultValues();
}

function treatDefaultValues() {

  if (!validateIP(configuration.DispatcherAddress)) {
    configuration.DispatcherAddress = undefined;
  }

}