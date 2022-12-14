import * as AuthService from '../services/auth.service';
import { errorHandler } from '../util/errorHandler';
import { IMiddleware } from '../config/types';
import { validate } from '../util/validate';

// регистрация
export const signup: IMiddleware = async (req, res, next) => {
  const email: string = req.body.email;
  const username: string = req.body.username;
  const password: string = req.body.password;
  try {
    // валидация ввода
    validate(req);
    // data extraction from req
    const savedUserId = await AuthService.signup(email, username, password);
    res.status(201).json({
      message: "User created!",
      userId: savedUserId
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
    // валидация ввода
    validate(req);
    const loginData = await AuthService.login(email, password);
    res.status(200).json({
      token: loginData.token,
      expiresIn: loginData.expiresIn,
      userId: loginData.userId
    });
  } catch (err) {
    errorHandler(err, next);
  }
}