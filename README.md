# Hapi-Boombox [![Build Status](https://travis-ci.org/AdriVanHoudt/Hapi-Boombox.svg)](https://travis-ci.org/AdriVanHoudt/Hapi-Boombox)
>Hapi error conversion and logging

## What

Boombox logs errors and is able to transform errors.
Current version targets hapi 16.

## How

Provide Boombox with custom errors (see [here](https://github.com/AdriVanHoudt/Hapi-Boombox/blob/master/test/config/errors.json) for an example) when registering and it will convert errors with messages that match a key in `errors` and will return a new Boom error.

```js
    const Errors = require('./test/config/errors.json'); //Look here for an example!
    server.register({
        register: require('hapi-boombox'),
        options: { errors: Errors }
    }, callback);
```

E.g. you return `new Error('RESOURCE_NOT_FOUND')` and the config states that this should return a `Boom.notFound` (404). Boombox will do that for you instead of returning an internal server error.
Look at [the test example](https://github.com/AdriVanHoudt/Hapi-Boombox/blob/master/test/config/errors.json) to see what the config night look like.

Boombox also provides a server and request method (`server.boombox()`, `request.boombox()`) so you can transform your errors on the go.
Returns `undefined` when matching fails.

```js
    const matched = server.boombox(new Error('RESOURCE_NOT_FOUND'));
    /*
    * matched
    *{
    *    message: 'Custom error message for RESOURCE_NOT_FOUND',
    *    type: 'notFound'
    *}
    */
```

You can disable the logging part by setting `disableLog` to `true`.

```js
    const Errors = require('./test/config/errors.json'); //Look here for an example!
    server.register({
        register: require('hapi-boombox'),
        options: { errors: Errors, disableLog: true }
    }, callback);
```

### Loging

Boombox will do a `request.log` with `hapi-boombox` and `error` as tags and the result as data.

* `error` the output of the error
* `stack` the stacktrace
* `request` additional info about the request
  * `path`, `query`, `method`, `payload`, `headers`, `request.info`, `credentials`
    * `credentials`: if present this will be an object that includes 2 properties from `request.auth.credentials`.
      * `id`.
      * These are properties required by the author for his project. If you want more or something customizable make an issue or PR.

## Test

100% test coverage!
Also look in the tests for more examples.

## Notes

Personally I use this in a hapi server to use generic keys as errors in my code but to give the end user a decent error message and to easily match errors with the right error code.
Maybe in the future this can also return localized errors.
