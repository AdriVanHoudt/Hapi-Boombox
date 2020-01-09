'use strict';

module.exports = {
    env: {
        node: true,
        es6: true
    },
    parserOptions: {
        ecmaVersion: 2018
    },
    extends: '@hapi/eslint-config-hapi',
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
