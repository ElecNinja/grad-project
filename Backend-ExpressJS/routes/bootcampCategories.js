const express = require('express');
const router = express.Router();
const bootcampCategories = require('../utils/bootcampCategories');

router.get('/', (req, res) => {
  res.json({ categories: bootcampCategories });
});

module.exports = router;
