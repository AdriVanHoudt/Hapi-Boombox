'use strict';

const Lab = require('lab');
const Code = require('code');
const Hapi = require('hapi');
const Basic = require('hapi-auth-basic');

const Errors = require('./config/errors.json');
const Errors2 = require('./config/errors2.json');


const lab = exports.lab = Lab.script();
const describe = lab.experiment;
const it = lab.it;
const expect = Code.expect;


describe('Startup', () => {

    it('Registers', (done) => {

        const server = new Hapi.Server({ debug: false });
        server.connection();

        server.register({
            register: require('../'),
            options: { errors: Errors }
        }, (err) => {

            expect(err).to.not.exist();

            server.start((err) => {

                expect(err).to.not.exist();

                done();
            });
        });
    });

    it('Only registers once', (done) => {

        const server = new Hapi.Server({ debug: false });
        server.connection();

        server.register([
            {
                register: require('../'),
                options: { errors: Errors }
            }, {
                register: require('../'),
                options: { errors: Errors2 }
            }
        ], (err) => {

            expect(err).to.not.exist();

            server.start((err) => {

                expect(err).to.not.exist();
                expect(server.registrations['hapi-boombox']).to.be.an.object();

                done();
            });
        });
    });

    it('Not providing custom errors does not throw', (done) => {

        const server = new Hapi.Server({ debug: false });
        server.connection();

        try {
            server.register({ register: require('../') }, () => {});
        }
        catch (e) {
            expect(e).to.not.exist();
        }

        done();
    });
});


describe('Boombox basics', () => {

    const server = new Hapi.Server({ debug: false });

    lab.before((done) => {

        server.connection();

        server.register([{
            register: require('../'),
            options: { errors: Errors }
        }, Basic], (err) => {

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
                method: 'GET',
                path: '/error',
                config: {
                    handler: function (request, reply) {

                        return reply(new Error('ERROR_KEY_1'));
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

                        if (request.payload) {
                            return reply(new Error(request.payload.error));
                        }

                        return reply(new Error('Something went wrong'));
                    }
                }
            }]);

            return done();
        });
    });

    it('Returns the right error for the provided key', (done) => {

        const payload = { error: 'ERROR_KEY_1' };

        server.inject({
            method: 'POST',
            url: '/error',
            payload: payload
        }, (response) => {

            expect(response.result).to.deep.equal({
                statusCode: 405,
                error: 'Method Not Allowed',
                message: 'Error one'
            });

            done();
        });
    });

    it('Returns the right error for a custom error', (done) => {

        const payload = { error: '--> IGNORE ME <--' };

        server.inject({
            method: 'POST',
            url: '/error',
            payload: payload
        }, (response) => {

            expect(response.request.getLog('implementation').length).to.equal(1);
            expect(response.result).to.deep.equal({
                statusCode: 500,
                error: 'Internal Server Error',
                message: 'An internal server error occurred'
            });

            done();
        });
    });

    it('Replies normally when not providing an error', (done) => {

        const payload = { normal: 'test' };

        server.inject({
            method: 'POST',
            url: '/normal',
            payload: payload
        }, (response) => {

            expect(response.result).to.deep.equal(payload);

            done();
        });
    });

    it('Only throws not converted errors', (done) => {

        const payload = { error: 'ERROR_KEY_1' };

        server.inject({
            method: 'POST',
            url: '/normal',
            payload: payload,
            headers: {
                authorization: 'Basic dGVzdDp0ZXN0'
            }
        }, (response) => {

            expect(response.request.getLog('implementation').length).to.equal(0);

            done();
        });
    });

    it('Has the credentials in the log', (done) => {

        const payload = { error: 'ERROR_KEY_1' };

        server.inject({
            method: 'POST',
            url: '/auth',
            payload: payload,
            headers: {
                authorization: 'Basic dGVzdDp0ZXN0'
            }
        }, (response) => {

            const credentials = response.request.getLog(false)[0].data.request.credentials;
            expect(credentials).to.deep.equal({ id: 1, name: 'John Doe' });

            expect(response.result).to.deep.equal({
                statusCode: 405,
                error: 'Method Not Allowed',
                message: 'Error one'
            });

            done();
        });
    });

    it('Deletes password from payload', (done) => {

        const payload = { error: 'ERROR_KEY_1', password: 'pleasedonothackme' };

        server.inject({
            method: 'POST',
            url: '/auth',
            payload: payload,
            headers: {
                authorization: 'Basic dGVzdDp0ZXN0'
            }
        }, (response) => {

            const logPayload = response.request.getLog(false)[0].data.request.payload;
            expect(logPayload).to.deep.equal({ error: 'ERROR_KEY_1' });

            expect(response.result).to.deep.equal({
                statusCode: 405,
                error: 'Method Not Allowed',
                message: 'Error one'
            });

            done();
        });
    });

    it('Logs on GET error', (done) => {

        server.inject({
            method: 'GET',
            url: '/error',
            headers: {
                authorization: 'Basic dGVzdDp0ZXN0'
            }
        }, (response) => {

            expect(response.result).to.deep.equal({
                statusCode: 405,
                error: 'Method Not Allowed',
                message: 'Error one'
            });

            done();
        });
    });

    it('Does notthing on normal error', (done) => {

        server.inject({
            method: 'POST',
            url: '/auth',
            headers: {
                authorization: 'Basic dGVzdDp0ZXN0'
            }
        }, (response) => {

            expect(response.result).to.deep.equal({
                statusCode: 500,
                error: 'Internal Server Error',
                message: 'An internal server error occurred'
            });

            done();
        });
    });
});
