'use strict';

const Lab = require('@hapi/lab');
const Code = require('@hapi/code');
const Hapi = require('@hapi/hapi');
const Basic = require('@hapi/basic');

const Errors = require('./config/errors.json');


const lab = exports.lab = Lab.script();
const describe = lab.experiment;
const it = lab.it;
const expect = Code.expect;


describe('Startup', () => {

    it('Registers', async () => {

        const server = Hapi.Server();

        await  server.register({
            plugin: require('../'),
            options: { errors: Errors }
        });

        await server.start();
    });

    it('Not providing custom errors does not throw', async () => {

        const server = Hapi.Server();

        try {
            await server.register({ plugin: require('../') });
        }
        catch (e) {
            expect(e).to.not.exist();
        }
    });
});


describe('Boombox basics', () => {

    const server = Hapi.Server();

    lab.before(async () => {

        await  server.register([{
            plugin: require('../'),
            options: { errors: Errors }
        }, Basic]);

        server.route([{
            method: 'POST',
            path: '/error',
            config: {
                handler: (request) => {

                    return new Error(request.payload.error);
                },
                log: { collect: true }
            }
        }]);

        server.route([{
            method: 'GET',
            path: '/error',
            config: {
                handler: (request, h) => {

                    return new Error('ERROR_KEY_1');
                }
            }
        }]);

        server.route([{
            method: 'POST',
            path: '/normal',
            config: {
                handler: (request, reply) => {

                    return request.payload;
                }
            }
        }]);

        server.auth.strategy('simple', 'basic', {
            validate: (request, username, password, h) => {

                return {
                    isValid: true,
                    credentials:
                        {
                            id: 1,
                            name: 'John Doe'
                        }
                };
            }
        });

        server.route([{
            method: 'POST',
            path: '/auth',
            config: {
                auth: 'simple',
                handler: (request, h) => {

                    if (request.payload) {
                        return new Error(request.payload.error);
                    }

                    return new Error('Something went wrong');
                },
                log: { collect: true }
            }
        }]);
    });

    it('Returns the right error for the provided key', async () => {

        const payload = { error: 'ERROR_KEY_1' };

        const response = await server.inject({
            method: 'POST',
            url: '/error',
            payload
        });

        expect(response.result).to.equal({
            statusCode: 405,
            error: 'Method Not Allowed',
            message: 'Error one'
        });
    });

    it('Returns the right error for a custom error', async () => {

        const payload = { error: 'Error' };

        const response = await server.inject({
            method: 'POST',
            url: '/error',
            payload
        });

        expect(response.request.logs.filter((l) => l.tags.includes('internal')).length).to.equal(1);
        expect(response.result).to.equal({
            statusCode: 500,
            error: 'Internal Server Error',
            message: 'An internal server error occurred'
        });
    });

    it('Replies normally when not providing an error', async () => {

        const payload = { normal: 'test' };

        const response = await server.inject({
            method: 'POST',
            url: '/normal',
            payload
        });

        expect(response.result).to.equal(payload);
    });

    it('Has the credentials in the log', async () => {

        const payload = { error: 'ERROR_KEY_1' };

        const response = await server.inject({
            method: 'POST',
            url: '/auth',
            payload,
            headers: {
                authorization: 'Basic dGVzdDp0ZXN0'
            }
        });

        const credentials = response.request.logs.filter((l) => l.tags.includes('hapi-boombox'))[0].data.request.credentials;
        expect(credentials).to.equal({ id: 1 });

        expect(response.result).to.equal({
            statusCode: 405,
            error: 'Method Not Allowed',
            message: 'Error one'
        });
    });

    it('Deletes password from payload', async () => {

        const payload = { error: 'ERROR_KEY_1', password: 'pleasedonothackme' };

        const response = await server.inject({
            method: 'POST',
            url: '/auth',
            payload,
            headers: {
                authorization: 'Basic dGVzdDp0ZXN0'
            }
        });

        const logPayload = response.request.logs.filter((l) => l.tags.includes('hapi-boombox'))[0].data.request.payload;
        expect(logPayload).to.equal({ error: 'ERROR_KEY_1' });

        expect(response.result).to.equal({
            statusCode: 405,
            error: 'Method Not Allowed',
            message: 'Error one'
        });
    });

    it('Logs on GET error', async () => {

        const response = await server.inject({
            method: 'GET',
            url: '/error',
            headers: {
                authorization: 'Basic dGVzdDp0ZXN0'
            }
        });

        expect(response.result).to.equal({
            statusCode: 405,
            error: 'Method Not Allowed',
            message: 'Error one'
        });
    });

    it('Does nothing on normal error', async () => {

        const response = await server.inject({
            method: 'POST',
            url: '/auth',
            headers: {
                authorization: 'Basic dGVzdDp0ZXN0'
            }
        });

        expect(response.result).to.equal({
            statusCode: 500,
            error: 'Internal Server Error',
            message: 'An internal server error occurred'
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

    it('Registers custom request function', async () => {

        const server2 = Hapi.Server();

        await server2.register([{
            plugin: require('../'),
            options: { errors: Errors }
        }]);

        server2.route([{
            method: 'POST',
            path: '/error',
            config: {
                handler: (request) => {

                    const matched = request.boombox(new Error(request.payload.error));
                    expect(matched).to.equal({
                        message: 'Error one',
                        type: 'methodNotAllowed'
                    });

                    return matched;
                }
            }
        }]);

        const response = await server2.inject({
            method: 'POST',
            url: '/error',
            payload: {
                error: 'ERROR_KEY_1'
            }
        });

        expect(response.statusCode).to.equal(200);
    });
});

describe('Options', () => {

    it('doesn\'t log with `disableLog`', async () => {

        const server = Hapi.Server();

        await server.register({
            plugin: require('../'),
            options: { errors: Errors, disableLog: true }
        });

        server.route([{
            method: 'POST',
            path: '/error',
            config: {
                handler: (request) => {

                    return new Error(request.payload.error);
                },
                log: { collect: true }
            }
        }]);

        await server.start();

        const response = await server.inject({
            method: 'POST',
            url: '/error',
            payload: {
                error: 'ERROR_KEY_400'
            }
        });

        expect(response.statusCode).to.equal(418);


        const hasBoomBoxLog = !!response.request.logs.find((log) => log.tags.includes('hapi-boombox'));
        expect(hasBoomBoxLog).to.be.false();
    });
});
