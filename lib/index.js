'use strict';

const Boom = require('boom');


const internals = {
    tags: ['hapi-boombox', 'error']
};

internals.boom = function boom(error) {

    const data = internals.errors[error.message];

    if (!data ) {
        return error;
    }

    const customBoom = Boom[data.type]();
    const explosion = new Error(data.message);

    Boom.boomify(explosion, { statusCode: customBoom.output.statusCode });
    explosion.isBoombox = true;

    return explosion;
};

exports.register = (server, options, next) => {

    internals.errors = options.errors || {};

    const lookup = (err) => {

        return err && internals.errors[err.message];
    };

    server.decorate('server', 'boombox', lookup);

    server.decorate('request', 'boombox', lookup);

    server.ext('onPreResponse', (request, reply) => {

        if (!request.response.isServer) {
            return reply.continue();
        }

        reply(internals.boom(request.response));

        /* $lab:coverage:off$ */
        if (!request.response ||
            !request.response._error ||
            !request.response._error.isBoombox ||
            request.response.statusCode === 400) {

            return;
        }
        /* $lab:coverage:on$ */

        const log = {
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
                id: request.auth.credentials.id
            };
        }

        if (log.request.payload && log.request.payload.password) {
            delete log.request.payload.password;
        }

        return request.log(internals.tags, log);
    });

    server.log(['hapi-boombox'], 'Turned on the Boombox');

    return next();
};

exports.register.attributes = {
    pkg: require('../package.json'),
    once: true,
    connections: true
};
