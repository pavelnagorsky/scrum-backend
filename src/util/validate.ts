import { validationResult } from "express-validator";

import { CustomRequest } from "../config/types";
import { checkValidity } from "./checkValidity";

// валидация запроса
export const validate = (req: CustomRequest) => {
  // валидация ввода
  const errors = validationResult(req);
  const validationErr = checkValidity(errors);
  if (validationErr) {
    validationErr.message = 'Validation failed. Please, provide correct data and make another request.';
    throw validationErr
  }
}