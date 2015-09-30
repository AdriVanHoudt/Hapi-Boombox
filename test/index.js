var Lab = require('lab');
var Code = require('code');
var Hapi = require('hapi');
var Basic = require('hapi-auth-basic');

var Errors = require('./config/errors.json');


var lab = exports.lab = Lab.script();
var describe = lab.experiment;
var it = lab.it;
var expect = Code.expect;


describe('Startup', function () {

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
});


describe('Boombox basics', function () {

    var server = new Hapi.Server();

    lab.before(function (done) {

        server.connection();

        server.register([{
            register: require('../'),
            options: { errors: Errors }
        }, Basic], function (err) {

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

            server.auth.strategy('simple', 'basic', {
                validateFunc: function (req, a, v, callback) {

                    return callback(null, true, { id: 1, name: 'John Doe' });
                }
            });

            server.route([{
                method: 'POST',
                path: '/auth',
                config: {
                    auth: 'simple',
                    handler: function (request, reply) {

                        return reply(new Error(request.payload.error));
                    }
                }
            }]);

            return done();
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

        var payload = { error: '--> IGNORE ME <--' };

        server.inject({
            method: 'POST',
            url: '/error',
            payload: payload
        }, function (response) {

            expect(response.request.getLog('implementation').length).to.equal(1);
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

    it('Only throws not converted errors', function (done) {

        var payload = { error: 'ERROR_KEY_1' };

        server.inject({
            method: 'POST',
            url: '/auth',
            payload: payload,
            headers: {
                authorization: 'Basic dGVzdDp0ZXN0'
            }
        }, function (response) {

            expect(response.request.getLog('implementation').length).to.equal(0);

            done();
        });
    });

    it('Has the credentials in the log', function (done) {

        var payload = { error: 'ERROR_KEY_1' };

        server.inject({
            method: 'POST',
            url: '/auth',
            payload: payload,
            headers: {
                authorization: 'Basic dGVzdDp0ZXN0'
            }
        }, function (response) {

            var credentials = response.request.getLog(false)[0].data.request.credentials;
            expect(credentials).to.deep.equal({ id: 1, name: 'John Doe' });

            expect(response.result).to.deep.equal({
                statusCode: 405,
                error: 'Method Not Allowed',
                message: 'Error one'
            });

            done();
        });
    });
});

describe('Options', function () {

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
