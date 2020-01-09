'use strict';

const Boom = require('@hapi/boom');


const internals = {
    tags: ['hapi-boombox', 'error'],
    disableLog: false
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

exports.plugin = {
    pkg: require('../package.json'),
    register: (server, options) => {

        internals.errors = options.errors || {};
        internals.disableLog = options.disableLog || false;

        const lookup = (err) => {

            return err && internals.errors[err.message];
        };

        server.decorate('server', 'boombox', lookup);

        server.decorate('request', 'boombox', lookup);

        server.ext('onPreResponse', (request, h) => {

            if (!request.response.isServer) {
                return h.continue;
            }

            return internals.boom(request.response);
        });

        if (!internals.disableLog) {
            server.events.on('response', (request) => {

                /* $lab:coverage:off$ */
                if (!request.response ||
                    !request.response._error ||
                    !request.response._error.isBoombox ||
                    request.response.statusCode === 400) {

                    return;
                }
                /* $lab:coverage:on$ */

                const log = {
                    error: request.response._error.output,
                    stack: request.response._error.stack,
                    request: {
                        id: request.id,
                        instance: request.info.uri,
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
        }

        server.log(['hapi-boombox'], 'Turned on the Boombox');
    }
};
