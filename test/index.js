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

    it('Registers', () => {

        const server = new Hapi.Server();
        server.connection();

        return new Promise((resolve) => {

            return server.register({
                register: require('../'),
                options: { errors: Errors }
            }, (err) => {

                expect(err).to.not.exist();

                server.start((err) => {

                    expect(err).to.not.exist();

                    return resolve();
                });
            });
        });
    });

    it('Only registers once', () => {

        const server = new Hapi.Server();
        server.connection();

        return new Promise((resolve) => {

            return server.register([
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

                    return resolve();
                });
            });
        });
    });

    it('Not providing custom errors does not throw', () => {

        const server = new Hapi.Server();
        server.connection();

        try {
            server.register({ register: require('../') }, () => {});
        }
        catch (e) {
            expect(e).to.not.exist();
        }
    });
});


describe('Boombox basics', () => {

    const server = new Hapi.Server();

    lab.before(() => {

        server.connection();

        return new Promise((resolve) => {

            return server.register([{
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
                        },
                        log: true
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
                    validateFunc: (req, a, v, callback) => {

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
                        },
                        log: true
                    }
                }]);

                return resolve();
            });
        });
    });

    it('Returns the right error for the provided key', () => {

        const payload = { error: 'ERROR_KEY_1' };

        return new Promise((resolve) => {

            return server.inject({
                method: 'POST',
                url: '/error',
                payload
            }, (response) => {

                expect(response.result).to.equal({
                    statusCode: 405,
                    error: 'Method Not Allowed',
                    message: 'Error one'
                });

                return resolve();
            });
        });
    });

    it('Returns the right error for a custom error', () => {

        const payload = { error: 'Error' };

        return new Promise((resolve) => {

            return server.inject({
                method: 'POST',
                url: '/error',
                payload
            }, (response) => {

                expect(response.request.getLog('internal').length).to.equal(1);
                expect(response.result).to.equal({
                    statusCode: 500,
                    error: 'Internal Server Error',
                    message: 'An internal server error occurred'
                });

                return resolve();
            });
        });
    });

    it('Replies normally when not providing an error', () => {

        const payload = { normal: 'test' };

        return new Promise((resolve) => {

            return server.inject({
                method: 'POST',
                url: '/normal',
                payload
            }, (response) => {

                expect(response.result).to.equal(payload);

                return resolve();
            });
        });
    });

    it('Has the credentials in the log', () => {

        const payload = { error: 'ERROR_KEY_1' };

        return new Promise((resolve) => {

            return server.inject({
                method: 'POST',
                url: '/auth',
                payload,
                headers: {
                    authorization: 'Basic dGVzdDp0ZXN0'
                }
            }, (response) => {

                const credentials = response.request.getLog(false)[0].data.request.credentials;
                expect(credentials).to.equal({ id: 1 });

                expect(response.result).to.equal({
                    statusCode: 405,
                    error: 'Method Not Allowed',
                    message: 'Error one'
                });

                return resolve();
            });
        });
    });

    it('Deletes password from payload', () => {

        const payload = { error: 'ERROR_KEY_1', password: 'pleasedonothackme' };

        return new Promise((resolve) => {

            return server.inject({
                method: 'POST',
                url: '/auth',
                payload,
                headers: {
                    authorization: 'Basic dGVzdDp0ZXN0'
                }
            }, (response) => {

                const logPayload = response.request.getLog(false)[0].data.request.payload;
                expect(logPayload).to.equal({ error: 'ERROR_KEY_1' });

                expect(response.result).to.equal({
                    statusCode: 405,
                    error: 'Method Not Allowed',
                    message: 'Error one'
                });

                return resolve();
            });
        });
    });

    it('Logs on GET error', () => {

        return new Promise((resolve) => {

            return server.inject({
                method: 'GET',
                url: '/error',
                headers: {
                    authorization: 'Basic dGVzdDp0ZXN0'
                }
            }, (response) => {

                expect(response.result).to.equal({
                    statusCode: 405,
                    error: 'Method Not Allowed',
                    message: 'Error one'
                });

                return resolve();
            });
        });
    });

    it('Does notthing on normal error', () => {

        return new Promise((resolve) => {

            return server.inject({
                method: 'POST',
                url: '/auth',
                headers: {
                    authorization: 'Basic dGVzdDp0ZXN0'
                }
            }, (response) => {

                expect(response.result).to.equal({
                    statusCode: 500,
                    error: 'Internal Server Error',
                    message: 'An internal server error occurred'
                });

                return resolve();
            });
        });
    });

    it('Registers custom server function', () => {

        const matched = server.boombox(new Error('ERROR_KEY_1'));

        expect(matched).to.equal({
            message: 'Error one',
            type: 'methodNotAllowed'
        });

        const unmatched = server.boombox(new Error('ERROR_KEY_2'));

        expect(unmatched).to.not.exist();
    });

    it('Custom server function works when passing nothing', () => {

        expect(() => {

            server.boombox(null);
        }).to.not.throw();
    });

    it('Registers custom request function', () => {

        const server2 = new Hapi.Server();

        server2.connection();

        return new Promise((resolve) => {

            return server2.register([{
                register: require('../'),
                options: { errors: Errors }
            }], (err) => {

                expect(err).to.not.exist();

                server2.route([{
                    method: 'POST',
                    path: '/error',
                    config: {
                        handler: function (request, reply) {

                            const matched = request.boombox(new Error(request.payload.error));
                            expect(matched).to.equal({
                                message: 'Error one',
                                type: 'methodNotAllowed'
                            });

                            return reply(matched);
                        }
                    }
                }]);

                server2.inject({
                    method: 'POST',
                    url: '/error',
                    payload: {
                        error: 'ERROR_KEY_1'
                    }
                }, (res) => {

                    expect(res.statusCode).to.equal(200);

                    return resolve();
                });
            });
        });
    });
});

describe('Options', () => {

    it('doesn\'t log with `disableLog`', () => {

        const server = new Hapi.Server();
        server.connection();

        return new Promise((resolve) => {

            return server.register({
                register: require('../'),
                options: { errors: Errors, disableLog: true }
            }, (err) => {

                expect(err).to.not.exist();

                server.route([{
                    method: 'POST',
                    path: '/error',
                    config: {
                        handler: function (request, reply) {

                            return reply(new Error(request.payload.error));
                        },
                        log: true
                    }
                }]);

                return server.start((err) => {

                    expect(err).to.not.exist();

                    return server.inject({
                        method: 'POST',
                        url: '/error',
                        payload: {
                            error: 'ERROR_KEY_400'
                        }
                    }, (res) => {

                        expect(res.statusCode).to.equal(418);


                        const hasBoomBoxLog = !!res.request.getLog().find((log) => log.tags.includes('hapi-boombox'));
                        expect(hasBoomBoxLog).to.be.false();

                        return resolve();
                    });
                });
            });
        });
    });
});
