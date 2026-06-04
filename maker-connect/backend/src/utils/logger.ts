import winston from 'winston';

const logLevel = process.env.LOG_LEVEL || 'info';
const logFormat = process.env.LOG_FORMAT || 'json';

const transporters: winston.transport[] = [
  new winston.transports.Console({
    format: logFormat === 'json'
      ? winston.format.combine(
          winston.format.timestamp(),
          winston.format.errors({ stack: true }),
          winston.format.json()
        )
      : winston.format.combine(
          winston.format.timestamp(),
          winston.format.colorize(),
          winston.format.printf(({ level, message, timestamp, ...meta }) => {
            let log = `${timestamp} [${level}] ${message}`;
            if (Object.keys(meta).length > 0) {
              log += ` ${JSON.stringify(meta)}`;
            }
            return log;
          })
        ),
  }),
];

// Add file transport in production
if (process.env.NODE_ENV === 'production') {
  transporters.push(
    new winston.transports.File({
      filename: process.env.LOG_FILE || 'logs/app.log',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
    })
  );
}

export const logger = winston.createLogger({
  level: logLevel,
  transports: transporters,
});
