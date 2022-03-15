const winston = require('winston');
const fs = require("fs");

if(!fs.existsSync("./logs") || !fs.statSync("./logs").isDirectory()) {
	fs.mkdirSync("./logs");
}

const consoleFormat = winston.format.printf(data => {
	if(data.stack != undefined) {
		return `[${data.timestamp}] ${data.level}: ${data.message}\n ${data.stack}`;
	}
	
	return `[${data.timestamp}] ${data.level}: ${data.message}`;
});

const logger = winston.createLogger({
	levels: winston.config.syslog.levels,
	level: 'info',
	format: winston.format.combine(
		winston.format.errors({ stack: true }),
		winston.format.timestamp(),
		winston.format.json()
	),
	transports: [
		new winston.transports.File({ filename: './logs/error.log', level: 'error' })
	]
});

logger.add(new winston.transports.Console({
	format: winston.format.combine(
		winston.format.errors({ stack: true }),
		winston.format.colorize(),
		winston.format.timestamp(), 
		winston.format.simple(), 
		consoleFormat
	),
	timestamp: false,
	level: "debug"
}));

logger.add(new winston.transports.File({
	filename: './logs/app.log',
	level: "debug"
}));

module.exports = logger;