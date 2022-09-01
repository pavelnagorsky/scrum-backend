import { Router } from 'express';
import { body } from 'express-validator';

import * as authControllers from '../controllers/auth';

const router = Router();

// регистрация пользователя
router.put("/signup", [
  body('email')
    .isEmail()
    .normalizeEmail(),
  body('password')
    .trim()
    .isLength({ min: 6 })
    .isAlphanumeric(),
  body('username')
    .trim()
    .matches(/^[а-яА-Яa-zA-Z0-9_-]+$/)
    .isLength({ min: 2 })
], authControllers.signup);

// авторизация пользователя
router.post('/login',
[
  body('email')
    .isEmail()
    .normalizeEmail(),
  body('password')
    .trim()
    .isLength({ min: 6 })
    .isAlphanumeric(),
], authControllers.login);

export default router;