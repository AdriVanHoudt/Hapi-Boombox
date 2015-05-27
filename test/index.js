var Lab = require('lab');
var Code = require('code');
var Boom = require('boom');
var Hapi = require('hapi');
var Basic = require('hapi-auth-basic');

var Errors = require('./config/errors.json');


var lab = exports.lab = Lab.script();
var describe = lab.experiment;
var it = lab.it;
var expect = Code.expect;


describe('Config', function () {

    it('Registers', function (done) {

        var server = new Hapi.Server();
        server.connection();

        server.register({
            register: require('../'),
            options: { errors: Errors }
        }, function (err) {

            expect(err).to.not.exist();

            server.start(function (err) {

                expect(err).to.not.exist();

                done();
            });
        });
    });

    it('Not providing custom errors does not throw', function (done) {

        var server = new Hapi.Server();
        server.connection();

        try {
            server.register({ register: require('../') }, function () {});
        } catch (e) {
            expect(e).to.not.exist();
        }

        done();
    });
});


describe('Boombox', function () {

    var server = new Hapi.Server();

    lab.before(function (done) {

        server.connection();

        server.register({
            register: require('../'),
            options: { errors: Errors }
        }, function (err) {

            expect(err).to.not.exist();

            server.route([{
                method: 'POST',
                path: '/error',
                config: {
                    handler: function (request, reply) {

                        return reply(new Error(request.payload.error));
                    }
                }
            }]);

            server.route([{
                method: 'POST',
                path: '/normal',
                config: {
                    handler: function (request, reply) {

                        return reply(request.payload);
                    }
                }
            }]);

            server.register(Basic, function (err) {

                server.auth.strategy('simple', 'basic', {
                    validateFunc: function (a, v, callback) {

                        return callback(null, true, { id: 1 });
                    }
                });

                server.route([{
                    method: 'GET',
                    path: '/auth',
                    config: {
                        auth: 'simple',
                        handler: function (request, reply) {

                            return reply(new Error(request.payload));
                        }
                    }
                }]);

                return done();
            });
        });
    });

    it('Returns the right error for the provided key', function (done) {

        var payload = { error: 'ERROR_KEY_1' };

        server.inject({
            method: 'POST',
            url: '/error',
            payload: payload
        }, function (response) {

            expect(response.result).to.deep.equal({
                statusCode: 405,
                error: 'Method Not Allowed',
                message: 'Error one'
            });

            done();
        });
    });

    it('Returns the right error for a custom error', function (done) {

        var payload = { error: 'Random error' };

        server.inject({
            method: 'POST',
            url: '/error',
            payload: payload
        }, function (response) {

            expect(response.result).to.deep.equal({
                statusCode: 500,
                error: 'Internal Server Error',
                message: 'An internal server error occurred'
            });

            done();
        });
    });

    it('Replies normally when not providing an error', function (done) {

        var payload = { normal: 'test' };

        server.inject({
            method: 'POST',
            url: '/normal',
            payload: payload
        }, function (response) {

            expect(response.result).to.deep.equal(payload);

            done();
        });
    });

    it('Has the credentials in the log', function (done) {

        server.inject({
            method: 'GET',
            url: '/auth',
            headers: {
                authorization: 'Basic dGVzdDp0ZXN0'
            }
        }, function (response) {

            expect(response.result).to.deep.equal({
                statusCode: 500,
                error: 'Internal Server Error',
                message: 'An internal server error occurred'
            });

            done();
        });
    });
});
