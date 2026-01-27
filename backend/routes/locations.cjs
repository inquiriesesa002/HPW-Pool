const express = require('express');
const router = express.Router();
const {
  getContinents,
  getCountries,
  getProvinceById,
  getProvinces,
  getCities,
  getRegionImages
} = require('../controllers/locationController.cjs');

router.get('/continents', getContinents);
router.get('/countries', getCountries);
router.get('/provinces/:id', getProvinceById);
router.get('/provinces', getProvinces);
router.get('/cities', getCities);
router.get('/regions/images', getRegionImages);

module.exports = router;

