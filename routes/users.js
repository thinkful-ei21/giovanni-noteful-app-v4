'use strict';

const express = require('express');
const mongoose = require('mongoose');

const User = require('../models/user');

const router = express.Router();



router.post('/',(req, res, next) =>{

  let {username, password, fullname = ''} = req.body;


  return User.hashPassword(password)
    .then(digest => {
      return User.create({
        username,
        password: digest,
        fullname
      });
    })
    .then(result => {
      return res.status(201).location(`/api/users/${result.id}`).json(result);
    })
    .catch(err => {
      if (err.code === 11000) {
        err = new Error('The username already exists');
        err.status = 400;
      }
      next(err);
    });

});



module.exports = router;