'use strict';

const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');
const Tag = require('../models/tag');
const Note = require('../models/note');

const router = express.Router();

/* ========== GET/READ ALL ITEMS ========== */
router.get('/', passport.authenticate('jwt', { session: false, failWithError: true }), (req, res, next) => {
  const userId = req.user.id;

  Tag.find({userId: userId})
    .sort('name')
    .then(results => {
      res.json(results);
    })
    .catch(err => {
      next(err);
    });
});

/* ========== GET/READ A SINGLE ITEM ========== */
router.get('/:id', passport.authenticate('jwt', { session: false, failWithError: true }), (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.id;

  /***** Never trust users - validate input *****/
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }

  Tag.findOne({_id: id, userId: userId})
    .then(result => {
      if (result) {
        res.json(result);
      } else {
        next();
      }
    })
    .catch(err => {
      next(err);
    });
});

/* ========== POST/CREATE AN ITEM ========== */
router.post('/', passport.authenticate('jwt', { session: false, failWithError: true }), (req, res, next) => {
  const { name } = req.body;
  const userId = req.user.id;
  const newTag = { name, userId };

  /***** Never trust users - validate input *****/
  if (!name) {
    const err = new Error('Missing `name` in request body');
    err.status = 400;
    return next(err);
  }

  Tag.create(newTag)
    .then(result => {
      res.location(`${req.originalUrl}/${result.id}`).status(201).json(result);
    })
    .catch(err => {
      if (err.code === 11000) {
        err = new Error('Tag name already exists');
        err.status = 400;
      }
      next(err);
    });
});

/* ========== PUT/UPDATE A SINGLE ITEM ========== */
router.put('/:id', passport.authenticate('jwt', { session: false, failWithError: true }), (req, res, next) => {
  const { id } = req.params;
  const { name } = req.body;
  const userId = req.user.id;

  /***** Never trust users - validate input *****/
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }

  if (!name) {
    const err = new Error('Missing `name` in request body');
    err.status = 400;
    return next(err);
  }

  const updateTag = { name };

  Tag.findById(id)
    .then(toUpdate => {
      if(`${toUpdate.userId}` !== userId){
        const err = new Error('you didn\'t build that!');
        err.status = 403;
        return Promise.reject(err);
      }
    })
    .then(()=>{
      return  Tag.findByIdAndUpdate(id, updateTag, { new: true });
    })
    .then(result => {
      if (result) {
        res.json(result);
      } else {
        next();
      }
    })
    .catch(err => {
      if (err.code === 11000) {
        err = new Error('Tag name already exists');
        err.status = 400;
      }
      next(err);
    });
});

/* ========== DELETE/REMOVE A SINGLE ITEM ========== */
router.delete('/:id', passport.authenticate('jwt', { session: false, failWithError: true }), (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.id;

  /***** Never trust users - validate input *****/
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }

  Tag.findById(id)
    .then(toUpdate => {
      if(`${toUpdate.userId}` !== userId){
        const err = new Error('you didn\'t build that!');
        err.status = 403;
        return Promise.reject(err);
      }
    })
    .then(()=>{
      const tagRemovePromise = Tag.findByIdAndRemove(id);
      const noteUpdatePromise = Note.updateMany(
        { tags: id, },
        { $pull: { tags: id } }
      );
      return  Promise.all([tagRemovePromise, noteUpdatePromise]);
    })
    .then(() => {
      res.sendStatus(204).end();
    })
    .catch(err => {
      next(err);
    });

});

module.exports = router;