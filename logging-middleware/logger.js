const axios = require('axios');
const winston = require('winston');

const localLogger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'logs/combined.log' })
    ]
});

const Log = async (level, pkg, message) => {
    const logPayload = {
        stack: 'backend',
        level: String(level || 'info').toLowerCase(),
        package: String(pkg || 'handler').toLowerCase(),
        message: message
    };

    try {
        localLogger.log(logPayload.level, message, logPayload);

        const res = await axios.post('http://4.224.186.213/evaluation-service/logs', logPayload);
        
        if (res.status === 200) {
            console.log(`[Remote Log Success] ID: ${res.data.logID}`);
        }
    } catch (err) {
        localLogger.error('Remote logging failed', {
            error: err.message,
            payload: logPayload
        });
    }
};

module.exports = { Log };
