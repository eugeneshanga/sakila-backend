  const express = require('express');
  const router = express.Router();
  const filmsController = require('../controllers/filmsController');

  router.get('/', filmsController.getFilms);

  router.get('/:id', filmsController.getFilmById);

  module.exports = router; 

