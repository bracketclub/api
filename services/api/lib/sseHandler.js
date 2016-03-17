'use strict';

const SUCCESS = 200;

module.exports = function sseHandler(channels) {
  return function _sseHandler(request, reply) {
    const channel = channels.add();
    request.raw.req.on('close', () => channels.remove(channel.id));
    reply(channel.channel).code(SUCCESS)
      .type('text/event-stream')
      .header('Access-Control-Allow-Credentials', true)
      .header('Access-Control-Allow-Origin', '*')
      .header('Access-Control-Expose-Headers', 'WWW-Authenticate,Server-Authorization')
      .header('Connection', 'keep-alive')
      .header('Cache-Control', 'no-cache')
      .header('Content-Encoding', 'identity');
  };
};
