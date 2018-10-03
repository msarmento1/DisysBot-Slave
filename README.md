# Slave

See also: 

- [Master](https://github.com/comnetunb/DisysBot-Master)
- [Protocol](https://github.com/comnetunb/DisysBot-Protocol)

## Introduction
Save application on a distributed system managed by [Master](https://github.com/comnetunb/DisysBot-Master)). This is a lightweight  service where its main purpose is to process tasks sent by dispatcher.

## Getting started

### Building and installing

#### Prereqs:
- [NodeJS v8.10.0 LTS or better](https://nodejs.org/en/)
- [Protocol](https://github.com/comnetunb/protocol). Extract the protocol directory and put it on the same level as the slave directory

After downloading and extracting the source to a directory, on a terminal, run the following command:

    npm install
    
And that's it!

## Running
After installing the slave, you can run it by executing the following command on terminal(pwd on root of the project):

    node app.js

## Configuration file
You can tweak the slave configuration on `<path to source>/config/config.json`

### Properties
- alias: defines an alias for the slave machine
- dispatcherAddress: sets the IP of a reachable dispatcher. If this property is set, the application will try to connect to it directly. If this property is not set, the connection mechanism will be the automatic discovery, that only works on a dispatcher configured on a local network shared by the slave aplication.
