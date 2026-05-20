const express = require('express');
const router = express.Router();

// Health check route
router.get('/', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'FuturSchool System API is running',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;

