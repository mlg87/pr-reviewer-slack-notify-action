import formatISO from 'date-fns/formatISO';
import winston from 'winston';


const alignColorsAndTime = winston.format.combine(
  winston.format.colorize({
    all: true,
  }),
  winston.format.label({
    label: `[PR-REVIEWER-SLACK-NOTIFY-ACTION]`,
  }),
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:MM:SS',
  }),
  winston.format.printf(
    (info) =>
      ` ${info.label}  ${formatISO(new Date())}  ${info.level} : ${
        info.message
      }`
  )
);

/**
log levels 
{
  emerg: 0,
  alert: 1,
  crit: 2,
  error: 3,
  warning: 4,
  notice: 5,
  info: 6,
  debug: 7
}
*/

winston.addColors({
  info: 'bold cyan', // fontStyle color
  warn: 'italic yellow',
  error: 'red',
  debug: 'green',
  crit: 'bold red',
});

export const logger = winston.createLogger({
  level: 'info',
  defaultMeta: {
    service: 'pr-reviewer-slack-notify-action',
  },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        alignColorsAndTime,
        winston.format.errors({ stack: true })
      ),
    }),
  ],
});