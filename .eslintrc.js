'use strict';

module.exports = {
    env: {
        node: true,
        es6: true,
        es2020: true
    },
    parserOptions: {
        ecmaVersion: 2020
    },
    extends: 'plugin:@hapi/recommended',
    rules: {
        'no-undef': 2,
        'no-unused-expressions': 2,
        'handle-callback-err': 2,
        'space-before-function-paren': [
            2,
            {
                anonymous: 'always',
                named: 'never'
            }
        ]
    }
};
