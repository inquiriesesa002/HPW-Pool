const express = require('express');
const router = express.Router();
const {
  getContinents,
  getCountries,
  getProvinces,
  getCities
} = require('../controllers/locationController');

router.get('/continents', getContinents);
router.get('/countries', getCountries);
router.get('/provinces', getProvinces);
router.get('/cities', getCities);

module.exports = router;

