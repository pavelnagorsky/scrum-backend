import { Result, ValidationError } from 'express-validator'

import { ErrorWithStatus } from '../config/types';

export const checkValidity = (errors: Result<ValidationError>) => {
    if (!errors.isEmpty()) {
      const error: ErrorWithStatus = new Error('Validation failed.');
      error.statusCode = 422;
      error.data = errors.array();
      return error;
    }
};
