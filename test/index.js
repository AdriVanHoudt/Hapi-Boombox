var Lab = require('lab');
var Code = require('code');
var Boom = require('boom');
var Hapi = require('hapi');

var lab = exports.lab = Lab.script();
var it = lab.it;
var expect = Code.expect;

var errors = require('./config/errors.json');

lab.experiment('Config', function () {

	it('Resgisters', function (done) {

		var server = new Hapi.Server();
		server.connection();

		server.register({
			register: require('../'),
			options: { errors: errors }
		}, function (err) {
			expect(err).to.not.exist();

			server.start(function(err) {
				expect(err).to.not.exist();

				done();
			});
		});
	});

	it('Throws when not passed errors key in options', function (done) {

		var server = new Hapi.Server();
		server.connection();

		try {

			server.register({ register: require('../') }, function () {});
		} catch (e) {
			expect(e).to.exist();

			done();
		}
	});

	it('Throws when not passed errors object', function (done) {

		var server = new Hapi.Server();
		server.connection();

		try {

			server.register({
				register: require('../'),
				options: 'test'
			}, function () {});

		} catch (e) {
			expect(e).to.exist();

			done();
		}
	});

	it('Registers server method', function (done) {

		var server = new Hapi.Server();
		server.connection();

		server.register({
			register: require('../'),
			options: { errors: errors}
		}, function (err) {
			expect(err).to.not.exist();

			expect(server.boom).to.exist();

			done();
		});
	});

	it('Registers reply method', function (done) {

		var server = new Hapi.Server();
		server.connection();

		server.register({
			register: require('../'),
			options: { errors: errors}
		}, function (err) {
			expect(err).to.not.exist();

			server.route([{
				method: 'GET',
				path: '/test',
				config: {
					handler: function (request, reply) {

						expect(reply.boom).to.exist();

						return reply.boom(new Error('error'));
					}
				}
			}]);

			server.inject({
				method: 'GET',
				url: '/test'
			}, function (response) {

				expect(response.result).to.deep.equal({
					statusCode: 400,
					error: 'Bad Request',
					message: 'error'
				});

				done();
			});
		});
	});

	it('Accepts null as options and defaults to true', function (done) {

		var server = new Hapi.Server();
		server.connection();

		server.register({
			register: require('../'),
			options: { errors: errors }
		}, function (err) {
			expect(err).to.not.exist();

			var error = server.boom(new Error(), null, null);

			expect(error).to.exist();

			done();
		});
	});

});


lab.experiment('Main', function () {

	var server = new Hapi.Server();


	lab.before(function (done) {
		server.connection();

		server.register({
			register: require('../'),
			options: { errors: require('./config/errors.json') }
		}, function (err) {
			expect(err).to.not.exist();

			return done();
		});
	});

	it('Returns the right error for the provided key', function (done) {

		var error = server.boom('ERROR_KEY_1');

		expect(error.isBoom).to.equal(true);
		expect(error.output.payload).to.deep.equal({
			statusCode: 405,
			error: 'Method Not Allowed',
			message: 'Error one'
		});

		done();
	});

	it('Returns the right error for a custom error', function (done) {

		var error = server.boom(new Error('Custom error'));

		expect(error.isBoom).to.equal(true);
		expect(error.output.payload).to.deep.equal({
			statusCode: 400,
			error: 'Bad Request',
			message: 'Custom error'
		});

		done();
	});

	it('Does not return an error when told to', function (done) {

		var error = server.boom(new Error('Custom error'), false);

		expect(error).to.equal('Custom error');

		return done();
	});

	it('Does not convert the error when told to', function (done) {

		var error = server.boom('Custom error', false, false);

		expect(error).to.equal('Custom error');

		return done();
	});

	it('Returns message when given Error and returnError = false && convert = true', function (done) {

		var error = server.boom(new Error('ERROR_KEY_1'), false, true);

		expect(error).to.equal('ERROR_KEY_1');

		return done();
	});

	it('Returns message corresponding with given key with returnError = false && convert = true', function (done) {

		var error = server.boom('ERROR_KEY_1', false, true);

		expect(error).to.equal('Error one');

		return done();
	});

	it('Returns error corresponding with given key with returnError = true && convert = false', function (done) {

		var error = server.boom('ERROR_KEY_1', true, false);

		expect(error).to.be.an.instanceOf(Error);
		expect(error.message).to.equal('ERROR_KEY_1');

		return done();
	});

	it('Returns error given Error and returnError = true && convert = false', function (done) {

		var error = server.boom(new Error('Custom error'), true, false);

		expect(error).to.be.an.instanceOf(Error);
		expect(error.message).to.equal('Error: Custom error');

		return done();
	});

	it('Returns Internal server error if trying to convert non existing key', function (done) {

		var error = server.boom('ERROR_KEY_INKNOWN');

		expect(error.isBoom).to.equal(true);
		expect(error.output.payload).to.deep.equal({
			statusCode: 500,
			error: 'Internal Server Error',
			message: 'An internal server error occurred'
		});

		return done();
	});

	it('Returns same Boom error if given Boom error', function (done) {

		var error = server.boom(Boom.badRequest());

		expect(error.isBoom).to.equal(true);
		expect(error.output.payload).to.deep.equal({
			statusCode: 400,
			error: 'Bad Request'
		});

		return done();
	});

	it('Returns Boom error if given Error', function (done) {

		var error = server.boom(new Error());

		expect(error.isBoom).to.equal(true);
		expect(error.output.payload).to.deep.equal({
			statusCode: 400,
			error: 'Bad Request'
		});

		return done();
	});

	it('Returns error from object', function (done) {

		var error = server.boom({ foo: 'bar' });

		expect(error).to.be.an.instanceOf(Error);

		return done();
	});

	it('Tries to convert but does not return error', function (done) {

		var error = server.boom({ foo: 'bar' }, false, true);

		expect(error).to.deep.equal({ foo: 'bar' });

		return done();
	});
});
