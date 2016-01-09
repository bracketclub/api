'use strict';

const SUCCESS = 200;

module.exports = function sseHandler(channels) {
  return function _sseHandler(request, reply) {
    const channel = channels.add();
    request.raw.req.on('close', () => channels.remove(channel.id));
    reply(channel.channel).code(SUCCESS)
      .type('text/event-stream')
      .header('Connection', 'keep-alive')
      .header('Cache-Control', 'no-cache')
      .header('Content-Encoding', 'identity');
  };
};
