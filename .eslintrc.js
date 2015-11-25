'use strict';

module.exports = {
    env: {
        node: true
    },
    extends: 'eslint-config-hapi',
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
