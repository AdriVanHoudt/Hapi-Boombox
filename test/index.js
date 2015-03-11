var Lab = require('lab');
var Path = require('path');
var Code = require('code');
var Boom = require('boom');

var lab = exports.lab = Lab.script();
var it = lab.it;
var expect = Code.expect;

lab.experiment('Config', function () {

	it('Resolves the config path correctly', function (done) {

		var BoomBox = require('../index')(Path.resolve(__dirname, './config/errors.json'));

		expect(BoomBox.boom).to.exist();

		return done();
	});

});

lab.experiment('Main', function () {
	it('Returns the right error for the provided key', function (done) {
		var BoomBox = require('../index')(Path.resolve(__dirname, './config/errors.json'));

		var error = BoomBox.boom('ERROR_KEY_1');

		expect(error.isBoom).to.be.a.boolean().and.to.equal(true);
		expect(error.output.payload.message).to.equal('Error one');

		return done();
	});

	it('Returns the right error for a custom error', function (done) {
		var BoomBox = require('../index')(Path.resolve(__dirname, './config/errors.json'));

		var error = BoomBox.boom(new Error('Custom error'));

		expect(error.isBoom).to.be.a.boolean().and.to.equal(true);
		expect(error.output.payload.message).to.equal('Custom error');

		return done();
	});

	it('Does not return an error when told to', function (done) {
		var BoomBox = require('../index')(Path.resolve(__dirname, './config/errors.json'));

		var error = BoomBox.boom(new Error('Custom error'), false);

		expect(error).to.equal('Custom error');

		return done();
	});

	it('Does not convert the error when told to', function (done) {
		var BoomBox = require('../index')(Path.resolve(__dirname, './config/errors.json'));

		var error = BoomBox.boom('Custom error', false, false);

		expect(error).to.equal('Custom error');

		return done();
	});

	it('Returns message when given Error and returnError = false && convert = true', function (done) {
		var BoomBox = require('../index')(Path.resolve(__dirname, './config/errors.json'));

		var error = BoomBox.boom(new Error('ERROR_KEY_1'), false, true);

		expect(error).to.equal('ERROR_KEY_1');

		return done();
	});

	it('Returns message corresponding with given key with eturnError = false && convert = true', function (done) {
		var BoomBox = require('../index')(Path.resolve(__dirname, './config/errors.json'));

		var error = BoomBox.boom('ERROR_KEY_1', false, true);
		expect(error).to.equal('Error one');

		return done();
	});

	it('Returns error corresponding with given key with returnError = true && convert = false', function (done) {
		var BoomBox = require('../index')(Path.resolve(__dirname, './config/errors.json'));

		var error = BoomBox.boom('ERROR_KEY_1', true, false);

		expect(error).to.be.an.instanceOf(Error);

		return done();
	});

	it('Returns error given Error and returnError = true && convert = false', function (done) {
		var BoomBox = require('../index')(Path.resolve(__dirname, './config/errors.json'));

		var error = BoomBox.boom(new Error('Custom error'), true, false);

		expect(error).to.be.an.instanceOf(Error);

		return done();
	});

	it('Returns BadImplemationError if trying to convert non existing key', function (done) {
		var BoomBox = require('../index')(Path.resolve(__dirname, './config/errors.json'));

		var error = BoomBox.boom('ERROR_KEY_INKNOWN');

		expect(error.isBoom).to.be.a.boolean().and.to.equal(true);

		return done();
	});

	it('Returns same Boom error if given Boom error', function (done) {
		var BoomBox = require('../index')(Path.resolve(__dirname, './config/errors.json'));

		var error = BoomBox.boom(Boom.badRequest());

		expect(error.isBoom).to.be.a.boolean().and.to.equal(true);

		return done();
	});

	it('Returns Boom error if given Error', function (done) {
		var BoomBox = require('../index')(Path.resolve(__dirname, './config/errors.json'));

		var error = BoomBox.boom(Boom.badRequest());

		expect(error.isBoom).to.be.a.boolean().and.to.equal(true);

		return done();
	});

	it('Returns error from object', function (done) {
		var BoomBox = require('../index')(Path.resolve(__dirname, './config/errors.json'));

		var error = BoomBox.boom({ foo: 'bar' });

		expect(error).to.be.an.instanceOf(Error);

		return done();
	});

	it('Tries to convert but does not return error', function (done) {
		var BoomBox = require('../index')(Path.resolve(__dirname, './config/errors.json'));

		var error = BoomBox.boom({ foo: 'bar' }, false, true);

		expect(error).to.deep.equal({ foo: 'bar' });

		return done();
	});
});

lab.experiment('Callback', function () {

	it('Uses a callback when provided', function (done) {
		var BoomBox = require('../index')(Path.resolve(__dirname, './config/errors.json'));

		return BoomBox.boom(new Error('Custom error'), null, null, function (error) {

			expect(error.isBoom).to.be.a.boolean().and.to.equal(true);
			expect(error.output.payload.message).to.equal('Custom error');

			return done();
		});
	});

	it('Uses a callback and does not return error', function (done) {
		var BoomBox = require('../index')(Path.resolve(__dirname, './config/errors.json'));

		return BoomBox.boom(new Error('Custom error'), false, null, function (error) {

			expect(error).to.equal('Custom error');

			return done();
		});
	});

	it('Returns error from object with a callback', function (done) {
		var BoomBox = require('../index')(Path.resolve(__dirname, './config/errors.json'));

		return BoomBox.boom(new Error(), false, false, function (error) {

			expect(error).to.be.an.instanceOf(Error);

			return done();
		});
	});
});
