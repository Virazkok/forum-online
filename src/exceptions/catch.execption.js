import httpStatus from 'http-status';
import fs from 'fs';
import { env } from 'process';

class HttpError extends Error {
  constructor(message = 'Unhandled http error') {
    super(message);
    this.name = this.constructor.name;
    this.http_code = httpStatus.INTERNAL_SERVER_ERROR;
    Error.captureStackTrace(this, this.constructor);
  }
}

class NotFound extends HttpError {
  constructor(message = 'Data not found') {
    super(message);
    this.http_code = httpStatus.NOT_FOUND;
  }
}

class Unauthenticated extends HttpError {
  constructor(message = 'Please authenticate') {
    super(message);
    this.http_code = httpStatus.UNAUTHORIZED;
  }
}

class BadRequest extends HttpError {
  constructor(message = 'Request cannot be processed') {
    super(message);
    this.http_code = httpStatus.BAD_REQUEST;
  }
}

class Forbidden extends HttpError {
  constructor(message = 'You do not have access') {
    super(message);
    this.http_code = httpStatus.FORBIDDEN;
  }
}

class TooEarly extends HttpError {
  constructor(message = 'You are too early to do this') {
    super(message);
    this.http_code = httpStatus.TOO_EARLY;
  }
}

class ServerError extends HttpError {
  constructor(message = 'Server error') {
    super(message);
    this.http_code = httpStatus.INTERNAL_SERVER_ERROR;
  }
}

const catchResponse = (err, req, res) => {
  let httpCode = err.http_code || 500,
    message = err.message || 'Server error',
    data = undefined,
    stack = env.NODE_ENV == 'development' ? err?.stack?.split('\n') : undefined;

  if (env.NODE_ENV == 'development') console.log(err);

  if (err.code == 'P2003') {
    httpCode = httpStatus.UNPROCESSABLE_ENTITY;
    message = 'Data cannot be processed due to relational constraints';
  } else if (err.name == 'PrismaClientValidationError') {
    httpCode = httpStatus.BAD_REQUEST;
    if (err.message.includes('Unknown argument')) {
      const part = err.message.match(/Unknown argument `[^`]+`/);
      message = part ? part[0] : 'Unknown argument on request';
    } else if (err.message.includes('Unknown field')) {
      const part = err.message.match(
        /Unknown field `[^`]+` for select statement`/
      );
      message = part ? part[0] : 'Unknown field name on request';
    }
  } else if (
    err.name == 'PrismaClientKnownRequestError' &&
    err.code == 'P2025'
  ) {
    httpCode = httpStatus.NOT_FOUND;
    message = 'Data tidak ditemukan';
  } else if (err.name == 'ValidationError' && err.details) {
    httpCode = httpStatus.UNPROCESSABLE_ENTITY;
    message = 'Validasi permintaan gagal';
    data = err.details.map((det) => det.message);
  } else if (err instanceof HttpError) {
    httpCode = err.http_code;
    message = err.message;
  } else {
    // logger.error(err);
  }

  // delete uploaded files on request for storage efficiency
  const uploaded = [];

  if (req.file) uploaded.push(req.file);
  if (req.files) {
    if (typeof req.files === 'object')
      Object.keys(req.files).forEach((field) => {
        req.files[field].forEach((file) => {
          uploaded.push(file);
        });
      });
    else if (Array.isArray(req.files))
      req.files.forEach((file) => uploaded.push(file));
  }

  if (uploaded.length)
    uploaded.forEach((up) => {
      fs.unlink(up.path, (err) => {
        if (err) {
          console.error('ERR(file): ', err);
        }
      });
    });

  res.status(httpCode).json({
    status: httpCode > 199 && httpCode < 300,
    message: message,
    data: data,
    stack: stack,
  });
};

export {
  catchResponse,
  ServerError,
  NotFound,
  Unauthenticated,
  Forbidden,
  BadRequest,
  TooEarly,
};
