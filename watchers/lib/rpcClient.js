'use strict';

const _ = require('lodash');
const rpc = require('json-rpc2');
const config = require('getconfig');

const rpcClient = rpc.Client.$create(config.watchers.rpc_port, config.hapi.host);

// fire and forget rpc
module.exports = (name, data) => rpcClient.call(name, data, _.noop);
