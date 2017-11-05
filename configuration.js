////////////////////////////////////////////////
//
// Copyright (c) 2017 Matheus Medeiros Sarmento
//
////////////////////////////////////////////////

var fs = require( 'fs' );
var validateIP = require( 'validate-ip-node' );

var configuration = {};

load();

module.exports.getConfiguration = function () {

   if ( Object.keys( configuration ).length === 0 && configuration.constructor === Object ) {
      load();
   }

   return configuration;
}

function load() {

   try {
      configuration = JSON.parse( fs.readFileSync( __dirname + '/config/config.json', 'utf8' ).replace( /^\uFEFF/, '' ) );
   } catch ( err ) {

   }

   treatDefaultValues();
}

function treatDefaultValues() {

   if ( !validateIP( configuration.DispatcherAddress ) ) {
      configuration.DispatcherAddress = undefined;
   }

}