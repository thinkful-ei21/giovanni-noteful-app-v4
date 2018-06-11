'use strict';

const express = require('express');
const mongoose = require('mongoose');

const User = require('../models/user');

const router = express.Router();



router.post('/',(req, res, next) =>{

  let {username, password, fullname = ''} = req.body;

  User.create({
    username: username,
    password: password,
    fullname: fullname
  })
    .then(user => user? res.status(201).json(user): next())
    .catch(err => next(err));

});



module.exports = router;