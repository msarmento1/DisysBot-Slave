# Worker

See also: 

- [Dispatcher](https://github.com/MatheusMS01/web_dispatcher)
- [Protocol](https://github.com/MatheusMS01/protocol)

## Introduction
Worker application on a distributed system managed by [dispatcher](https://github.com/MatheusMS01/web_dispatcher). This is a lightweight where its main purpose is to process tasks sent by dispatcher.

## Getting started

### Building and installing

#### Prereqs:
- [NodeJS v8.10.0 LTS or better](https://nodejs.org/en/)
- [Protocol](https://github.com/MatheusMS01/protocol). Extract the protocol directory and put it on the same level as the worker directory (It *must* be named as protocol)

After downloading and extracting the source to a directory, on a terminal, run the following command:

    npm install
    
And that's it!

## Running
After installing the worker, you can run it by executing the following command on terminal(pwd on root of the project):

    node app.js

## Configuration file
You can tweak the worker configuration on */worker/config/config.json*

### Properties
- alias: defines an alias for the worker machine
- dispatcherAddress: sets the IP of a reachable dispatcher. If this property is set, the application will try to connect to it directly. If this property is not set, the connection mechanism will be the automatic discovery, that only works on a dispatcher configured on a local network shared by the worker aplication.
