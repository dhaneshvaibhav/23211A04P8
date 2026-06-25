const { Log } = require('./logger');

// Middleware to log all incoming requests
const requestLogger = (req, res, next) => {
    const start = Date.now();

    res.on('finish', () => {
        const timeTaken = Date.now() - start;
        const { method, originalUrl } = req;
        const { statusCode } = res;

        // Pick log level based on status
        let level = 'info';
        if (statusCode >= 500) level = 'error';
        else if (statusCode >= 400) level = 'warn';

        const msg = `${method} ${originalUrl} ${statusCode} (${timeTaken}ms)`;
        
        // Always 'backend' stack, package 'route' for generic logs
        Log(level, 'route', msg);
    });

    next();
};

// Error handler to catch and log backend crashes
const errorLogger = (err, req, res, next) => {
    const errorMsg = err.message || 'Unknown error occurred';
    
    // Log with 'handler' package and 'error' level
    Log('error', 'handler', errorMsg);

    next(err);
};

module.exports = {
    requestLogger,
    errorLogger
};
