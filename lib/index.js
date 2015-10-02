var Boom = require('boom');


var internals = {
    tags: ['hapi-boombox']
};

internals.boom = function boom(error) {

    var data = internals.errors[error.message];
    var explosion = null;

    if (!data ) {
        return error;
    }

    var customBoom = Boom[data.type]();

    explosion = new Error(data.message);

    Boom.wrap(explosion, customBoom.output.statusCode, data.message);
    explosion.isBoombox = true;

    return explosion;
};

exports.register = function (server, options, next) {

    internals.errors = options.errors || {};

    server.ext('onPreResponse', function (request, reply) {

        if (!request.response.isServer) {
            return reply.continue();
        }

        var explosion = internals.boom(request.response);

        reply(explosion);

        if (!explosion.isBoombox) {
            throw explosion;
        }

        return;
    });

    server.on('response', function (request, event, tags) {

        /* $lab:coverage:off$ */
        if (!request.response || !request.response._error || !request.response._error.isBoombox) {
            return;
        }
        /* $lab:coverage:on$ */

        var log = {
            error: request.response.output,
            stack: request.response.stack,
            request: {
                id: request.id,
                instance: request.connection.info.uri,
                labels: request.connection.settings.labels,
                path: request.url.path,
                query: request.query,
                statusCode: request.raw.res.statusCode,
                method: request.method,
                payload: request.payload,
                headers: request.headers,
                responseTime: request.info.responded - request.info.received,
                info: request.info
            }
        };

        if (request.auth.credentials) {
            log.request.credentials = {
                id: request.auth.credentials.id,
                name: request.auth.credentials.name
            };
        }

        request.log(internals.tags, log);
    });

    server.log(internals.tags, 'Registered hapi-boombox');

    return next();
};

exports.register.attributes = {
    pkg: require('../package.json')
};
