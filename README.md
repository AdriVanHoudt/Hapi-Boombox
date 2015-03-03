
* bomb.boom is basicly a fancy wrapper around Hapijs Boom
* Accepts an error (type Error) as first param OR a key that matches in the errors file to create a new error
* If it is just an error object iw will wrap it inside a Boom error
* If the error is allready a Boom error it will just return that
* If the error is an object that matches the error object in the errors file it will create a Boom error from it
* If it is a key it will genrate a Boom error with data from the errors file
* If the key can't be matched it will return a badImplementation error
