[![Build Status](https://travis-ci.org/AdriVanHoudt/BoomBox.svg)](https://travis-ci.org/AdriVanHoudt/BoomBox)
# BoomBox
>Boom wrapper

## What
Boombox allows you to create Boom errors and errors from a config file.
This can be used to have errors in your code that uses generic keys e.g. `USER_NO_ACCESS` and it will be translated to a Boom error with a decent message e.g. `You have no access to this method`.
Boombox also allows you to specify the type of Boom error. e.g. `USER_NO_ACCESS` can be defined as a `methodNotAllowed` and it will automaticlly generate a Boom error with the right statuscode.

## How

#### require('boombox')(absolute-path-to-errors-file)
`var BoomBox = require('boombox')(Path.resolve(__dirname, './config/errors.json'));`
The `Path.resolve()` is needed so Boombox will require the right file.

#### Boombox.boom(Error key/Error/String/Object, [returnError], [convert], [callback])
You can pass anything into the boom method. Boombox will try to math an error from the errors file and otherwise generate another Boom error.
You pass some options into the method.
    * `returnError` - default `true`, if `false` will return only the error message.
		* `convert` - default `true`, if `false` will not try to convert to a Boom error. If `returnError` is `true` will generate a generic Error
    * `callback` - if you want to work async 
If you try to convert a non existing key into a Boom error it will generate a `badImplementation` error. This is mostly to be sure you get an error but this might change in the future.
    
## Test
100% test coverage!

## Notes
Personally I use this in a Hapi server to use generic keys as errors in my code but to give the end user a decent error message and to easily match errors with the right error code.
Just do `reply(BoomBox.boom(err);` in your handler (in my case controller) at the very last moment and you are sure to pass a decent error to your user.
