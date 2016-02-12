'use strict';

const _ = require('lodash');
const rpc = require('json-rpc2');
const config = require('getconfig');

const rpcClient = rpc.Client.$create(config.watchers.rpc_port, config.hapi.host);

// fire and forget rpc
module.exports = (name, event, data) => rpcClient.call(name, _.assign({event}, data || {}), _.noop);
