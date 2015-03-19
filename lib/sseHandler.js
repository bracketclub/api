module.exports = function (channels) {
    return function (request, reply) {
        var channel = channels.add();
        request.raw.req.on("close", function() {
            channels.remove(channel.id);
        });
        reply(channel.channel).code(200)
        .type('text/event-stream')
        .header('Connection', 'keep-alive')
        .header('Cache-Control', 'no-cache')
        .header('Content-Encoding', 'identity');
    };
};
