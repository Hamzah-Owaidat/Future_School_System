const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

// Import routes
const apiRoutes = require('./routes');
const healthRoutes = require('./routes/health.routes');

// Import middleware
const errorHandler = require('./middleware/errorHandler');
const notFound = require('./middleware/notFound');

const app = express();

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/health', healthRoutes);
app.use('/api', apiRoutes);

// 404 handler (must be after all routes)
app.use(notFound);

// Error handling middleware (must be last)
app.use(errorHandler);

module.exports = app;

