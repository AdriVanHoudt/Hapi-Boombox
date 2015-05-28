var Boom = require('boom');


var internals = {
    tags: ['hapi-boombox']
};


internals.boom = function boom (error) {

    var data = internals.errors[error.message];
    var explosion = null;

    if (!data ) {
        return error;
    }

    var customBoom = Boom[data.type]();

    explosion = new Error(data.message);

    Boom.wrap(explosion, customBoom.output.statusCode, data.message);

    return explosion;
};

exports.register = function (server, options, next) {

    internals.errors = options.errors || {};

    server.ext('onPreResponse', function (request, reply) {

        if (request.response.isServer) {
            var explosion = internals.boom(request.response);

            var log = {
                error: request.response.output,
                stack: request.response.stack,
                request: {
                    path: request.url.path,
                    query: request.query,
                    method: request.method,
                    payload: request.payload,
                    headers: request.headers,
                    info: request.info
                }
            };

            if (request.auth.credentials) {
                log.request.credentials = {
                    id: request.auth.credentials.id,
                    name: request.auth.credentials.name
                };
            }

            reply(explosion);
            return server.log(internals.tags, log);
        }

        return reply.continue();
    });

    server.log(internals.tags, 'Registered hapi-boombox');

    return next();
};

exports.register.attributes = {
    pkg: require('../package.json')
};
