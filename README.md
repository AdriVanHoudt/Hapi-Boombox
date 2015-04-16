[![Build Status](https://travis-ci.org/AdriVanHoudt/Hapi-Boombox.svg)](https://travis-ci.org/AdriVanHoudt/Hapi-Boombox)
# Hapi-BoomBox
>Hapi plugin Boom wrapper

## What
Boombox allows you to create Boom errors and errors from a given errors set.
This can be used to have errors in your code that uses generic keys e.g. `USER_NO_ACCESS` and it will be translated to a Boom error with a decent message e.g. `You have no access to this method`.
Boombox also allows you to specify the type of Boom error. e.g. `USER_NO_ACCESS` can be defined as a `methodNotAllowed` and it will automaticlly generate a Boom error with the right statuscode.

## How

#### (server/reply).boom(Error key/Error/String/Object, [returnError], [convert])
You can pass anything into the boom method. Boombox will try to match an error from the errors file and otherwise generate another Boom error.

You pass some options into the method.

* `returnError` - If `false` will return only the error message. If `convert` is true Boombox will try to convert to an error first (matched from errors or general error)
* `convert` - If `false` will not try to convert to a Boom error. If `returnError` is `true` will generate a generic Error
    
If you try to convert a non existing key into a Boom error it will generate a `Internal Server Error` error. This is by design (atm) to make sure you notice it when you use an non implemented error key.

###### Loging
Both methods will do a `server.log` with `hapi-boombox` as tag and the result as data.
`reply.boom` logs some aditional data: 

* `error`: the restult of Boombox,
* `data`: additional info about the request
    * `path`, `query`, `method`, `payload`, `headers`, `request.info`, `credentials`
        * `credentials`: if present this will be an object that includes 2 properties from `request.auth.credentials`. 
            * `id` and `name`. 
            * These are properties required by the author for his project. If you want more or something custumizable make an issue or PR.
 
## Test
100% test coverage!
Also look in the tests for more examples.

## Notes
Personally I use this in a Hapi server to use generic keys as errors in my code but to give the end user a decent error message and to easily match errors with the right error code.
Just do `reply.boom(err);` for your errors and you are sure to pass a decent error to your user.
