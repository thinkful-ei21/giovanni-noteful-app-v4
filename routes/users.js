'use strict';

const express = require('express');

const User = require('../models/user');

const router = express.Router();

router.get('/', (req, res, next) => {

  User.find()
    .sort('name')
    .then(results => {
      res.json(results);
    })
    .catch(err => {
      next(err);
    });
});

router.post('/',(req, res, next) =>{

  let {username, password, fullname = ''} = req.body;

    
  //   The username and password fields are required
  const requiredFields = ['username', 'password'];
  const missingField = requiredFields.find(field => !(field in req.body));

  if (missingField) {
    const err = new Error(`Missing ${missingField} in request body`);
    err.status = 422;
    return next(err);
  }

  //   The fields are type string
  const badlyFormattedField = requiredFields.find(field =>  !(typeof req.body[field] === 'string'));

  if(badlyFormattedField){
    const err = new Error(`${badlyFormattedField} should be a string`);
    err.status = 422;
    return next(err);
  }

  //   The username and password should not have leading or trailing whitespace. And the endpoint should not automatically trim the values


  const whitespaceInField = requiredFields.find(field =>{
    const value = req.body[field];
    return value.length !== value.trim().length;
    //   console.log(field, field.length, field.trim().length, test)
  });

  if(whitespaceInField){
    const err = new Error(`${whitespaceInField} should not have trailing or leading spaces`);
    err.status = 422;
    return next(err);
  }


  if(username.length < 1){
    const err = new Error('name must be at least 1 character long');
    err.status = 422;
    return next(err);
  }
  
  //   The password is a minimum of 8 and max of 72 characters
  if(password.length < 8 || password.length > 72){
    const err = new Error('password must be a minimum of 8 and max of 72 characters');
    err.status = 422;
    return next(err);
  }



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