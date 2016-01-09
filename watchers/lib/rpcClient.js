'use strict';

const rpc = require('json-rpc2');
const config = require('getconfig');

const rpcClient = rpc.Client.$create(config.watchers.rpc_port, 'localhost');

module.exports = rpcClient;
