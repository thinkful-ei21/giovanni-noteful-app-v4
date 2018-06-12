'use strict';

// require('dotenv').config();

const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');

const {JWT_SECRET, JWT_EXPIRY}  = require('../config');

const router = express.Router();


function createToken (user){
  return jwt.sign({user},
    JWT_SECRET,
    {
      subject: user.username,
      expiresIn: JWT_EXPIRY
    });
}

const localAuth = passport.authenticate('local', {session: false, failWithError: true});
const jwtAuth = passport.authenticate('jwt', { session: false, failWithError: true });


router.post('/login', localAuth, function (req, res) {

  res.json( createToken(req.user));

});

router.post('/refresh', jwtAuth, function (req, res){

  res.json( createToken(req.user));
});


module.exports = router;