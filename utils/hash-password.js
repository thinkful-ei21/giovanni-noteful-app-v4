'use strict';

const bcrypt = require('bcryptjs');

const password = 'password';

bcrypt.hash(password, 10)
    .then(digest =>{
        console.log('hash: ', digest);


    })
