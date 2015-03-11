var Boom = require('boom');

var internals = {};

internals.boom = function boom(error, returnError, convert, callback) {
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

	if (callback) {
		if (returnError) {
			return callback(explosion);
		}

		return callback(explosion.message || explosion);
	}

	if (returnError) {
		return explosion;
	}

	return explosion.message || explosion;
};

module.exports = function (configPath) {
	internals.errors = require(configPath);

	if (typeof internals.errors !== 'object') {
		throw new Error(configPath + ' is not a valid path to the errors file')
	}

	module.boom = internals.boom;

	return module;
};
