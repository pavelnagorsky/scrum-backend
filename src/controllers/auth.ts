import bcrypt from 'bcryptjs';
import { validationResult } from 'express-validator';

import { User } from '../models/user';
import { jwtConfig } from '../config/jwtToken';
import { errorHandler } from '../util/errorHandler';
import { checkValidity } from '../util/checkValidity';
import { ErrorWithStatus, IMiddleware } from '../config/types';

// регистрация
export const signup: IMiddleware = async (req, res, next) => {
  try {
    // валидация ввода
    const errors = validationResult(req);
    const validationErr = checkValidity(errors);
    if (validationErr) {
      validationErr.message = 'Validation failed. Please, provide correct data and make another request.';
      throw validationErr
    };

    const email: string = req.body.email;
    const username: string = req.body.username;
    const password: string = req.body.password;
    // проверка существования емэйла
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      const error: ErrorWithStatus = new Error('E-Mail already exists. Please, try a different one.');
      error.statusCode = 401; // no authenticated
      throw error;
    }
    // зашифровка пароля
    const hashedPw = await bcrypt.hash(password, 12);
    // создание нового пользователя
    const user = new User({
      email,
      password: hashedPw,
      username
    });
    const savedUser = await user.save();
    res.status(201).json({
      message: "User created!",
      userId: savedUser._id
    });
  } catch (err) {
    errorHandler(err, next);
  }
};

// авторизация
export const login: IMiddleware = async (req, res, next) => {
  const email: string = req.body.email;
  const password: string = req.body.password;
  try {
    // проверка валидации
    const errors = validationResult(req);
    const validationErr = checkValidity(errors);
    if (validationErr) {
      validationErr.message = 'Validation failed. Please, provide correct data and make another request.';
      throw validationErr
    };

    const user = await User.findOne({ email });
    if (!user) {
      const error: ErrorWithStatus = new Error('No user with this email found.');
      error.statusCode = 401; // no authenticated
      throw error;
    };
    const isEqual = await bcrypt.compare(password, user.password);
    if (!isEqual) {
      const error: ErrorWithStatus = new Error('Password is incorrect.');
      error.statusCode = 401; // no authenticated
      throw error;
    };
    const token = jwtConfig({
      email: user.email,
      _id: user._id.toString()
    });
    const expirationDate = 24 * 3600000; // token lifetime (24h)
    res.status(200).json({
      token,
      expiresIn: expirationDate,
      userId: user._id.toString()
    });
  } catch (err) {
    errorHandler(err, next);
  }
}