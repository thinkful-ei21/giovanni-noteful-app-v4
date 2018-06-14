'use strict';

const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');
const Folder = require('../models/folder');
const Note = require('../models/note');

const router = express.Router();

/* ========== GET/READ ALL ITEMS ========== */
router.get('/', passport.authenticate('jwt', { session: false, failWithError: true }), (req, res, next) => {
  const userId = req.user.id;

  Folder.find({userId:userId})
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

  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }

  Folder.findOne({_id: id, userId: userId})
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
  const newFolder = { name, userId };

  /***** Never trust users - validate input *****/
  if (!name) {
    const err = new Error('Missing `name` in request body');
    err.status = 400;
    return next(err);
  }

  Folder.create(newFolder)
    .then(result => {
      res.location(`${req.originalUrl}/${result.id}`).status(201).json(result);
    })
    .catch(err => {
      if (err.code === 11000) {
        err = new Error('Folder name already exists');
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

  const updateFolder = { name };

  Folder.findById(id)
    .then(toUpdate => {
      if(!toUpdate){
        return Promise.reject({status: 404, message:'folder not found'});
      }
      else if(`${toUpdate.userId}` !== userId){
        const err = new Error('you didn\'t build that!');
        err.status = 403;
        return Promise.reject(err);
      }
    })
    .then(()=>{
      return Folder.findByIdAndUpdate(id, updateFolder, { new: true });})
    .then(result => {
      if (result) {
        res.json(result);
      } else {
        next();
      }
    })
    .catch(err => {
      if (err.code === 11000) {
        err = new Error('Folder name already exists');
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

  // let toUpdate = {}
  // Folder.findById(id).then(obj => {
  //   console.log(obj)
  //   toUpdate = obj;});
  // console.log(toUpdate, userId);
  // if(toUpdate.userId !== userId){
  //   const err = new Error('you didn\'t build that!');
  //   err.status = 403;
  //   return next(err);
  // }

 
  Folder.findById(id)
    .then(toUpdate => {
      if(`${toUpdate.userId}` !== userId){
        const err = new Error('you didn\'t build that!');
        err.status = 403;
        return Promise.reject(err);
      }
    })
    .then(()=>{
      // ON DELETE SET NULL equivalent
      const folderRemovePromise = Folder.findByIdAndRemove(id);
      // ON DELETE CASCADE equivalent
      // const noteRemovePromise = Note.deleteMany({ folderId: id });

      const noteRemovePromise = Note.updateMany(
        { folderId: id },
        { $unset: { folderId: '' } }
      );

      return Promise.all([folderRemovePromise, noteRemovePromise]);
    })
    .then(() => {
      res.sendStatus(204);
    })
    .catch(err => {
      next(err);
    });
});

module.exports = router;
