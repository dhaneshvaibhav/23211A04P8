const { Log } = require('./logger');

const requestLogger = (req, res, next) => {
    const start = Date.now();

    res.on('finish', () => {
        const timeTaken = Date.now() - start;
        const { method, originalUrl } = req;
        const { statusCode } = res;

        let level = 'info';
        if (statusCode >= 500) level = 'error';
        else if (statusCode >= 400) level = 'warn';

        const msg = `${method} ${originalUrl} ${statusCode} (${timeTaken}ms)`;
        
        Log(level, 'route', msg);
    });

    next();
};

const errorLogger = (err, req, res, next) => {
    const errorMsg = err.message || 'Unknown error occurred';
    
    Log('error', 'handler', errorMsg);

    next(err);
};

module.exports = {
    requestLogger,
    errorLogger
};
