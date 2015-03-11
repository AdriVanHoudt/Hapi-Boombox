var Boom = require('boom');

var internals = {};

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
					var boom = Boom[data.type]();

					explosion = new Error(data.message);

					Boom.wrap(explosion, boom.output.statusCode, data.message);
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
		return this.response(internals.boom(error, returnError, convert));
	});

	server.decorate('server', 'boom', function (error, returnError, convert) {
		return internals.boom(error, returnError, convert);
	});

	return next();
};

exports.register.attributes = {
	pkg: require('../package.json')
};
