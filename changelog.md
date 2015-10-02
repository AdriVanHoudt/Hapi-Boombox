# Changelog

# 3.1.1
* only log when needed

# 3.1.0
* Update dependencies
* Log after reply instead of before
* Added some extra info to the log
* Now tested against hapi 10.x see https://github.com/hapijs/hapi/issues/2765

## 3.0.0
* No more `throw: true`, Boombox wil now only throw if it couldn't convert
* Converted errors now have the `isBoombox` property like the `isServer` one
* Updated dependencies

## 2.2.0
* Added `throw` option. When `true` it will alao throw the modified error. This can be usefull in some logging or debugging cases.

## 2.1.0
* Only deal with server errors (prevents from logging and tryin to convert 404's for example)

## 2.0.0
* Simplify all the things
* Complete rewrite
    * Logging and converting now happens on `onPreResponse` so no more need for `reply.boom`, you can use `reply` directly as the callback
    * This is more in allignment with how hapi works. Just pass an error with the key as message and boombox will do the rest for you.
* Cleanup
* Update boom version
* Don't throw when not providing custom errors

## 1.1.3
* Log original and proccesed error
* Log the full proccessed error and not only the message

## 1.1.2
* Added more data to the loging

## 1.1.0
* Added extra loging info on `reply.boom`
* Better linting