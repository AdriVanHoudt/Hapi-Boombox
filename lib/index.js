var Boom = require('boom');


var internals = {
    tags: ['hapi-boombox']
};


internals.boom = function boom(error, returnError, convert) {

    var explosion = null;

    // convert && return error by default
    if (convert === null || convert === undefined) {
        convert = true;
    }

    if (returnError === null || returnError === undefined) {
        returnError = true;
    }

    if (convert) {
        if (typeof error === 'string') {
            var data = internals.errors[error];

            if (!data) {
                explosion = Boom.badImplementation(error + ' is not a valid error key');
            } else {
                if (returnError) {
                    var customBoom = Boom[data.type]();

                    explosion = new Error(data.message);

                    Boom.wrap(explosion, customBoom.output.statusCode, data.message);
                } else {
                    explosion = data.message;
                }
            }
        } else if (error instanceof Error) {
            Boom.wrap(error, 400);

            explosion = error;
        } else if (returnError) {
            explosion = new Error(error);
        } else {
            explosion = error;
        }
    } else if (returnError) {
        explosion = new Error(error);
    } else {
        explosion = error;
    }

    if (returnError) {
        return explosion;
    }

    return explosion.message || explosion;
};

exports.register = function (server, options, next) {

    if (!options.hasOwnProperty('errors')) {
        throw new Error('Options must include errors object');
    }

    internals.errors = options.errors;

    server.decorate('reply', 'boom', function (error, returnError, convert) {

        var explosion = internals.boom(error, returnError, convert);

        var log = {
            originalError: error,
            boomboxError: explosion,
            data: {
                path: this.request.url.path,
                query: this.request.query,
                method: this.request.method,
                payload: this.request.payload,
                headers: this.request.headers,
                info: this.request.info
            }
        };

        if (this.request.auth.credentials) {
            log.data.credentials = {
                id: this.request.auth.credentials.id,
                name: this.request.auth.credentials.name
            };
        }

        this.response(explosion);
        return server.log(internals.tags, log);
    });

    server.decorate('server', 'boom', function (error, returnError, convert) {

        var explosion = internals.boom(error, returnError, convert);

        server.log(internals.tags, explosion.output || explosion);

        return explosion;
    });

    server.log(internals.tags, 'Registered reply.boom() and server.boom()');

    return next();
};

exports.register.attributes = {
    pkg: require('../package.json')
};
