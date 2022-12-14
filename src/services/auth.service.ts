import { compare, hash } from 'bcryptjs';

import { jwtConfig } from '../config/jwtToken';
import { ErrorWithStatus } from "../config/types";
import { User } from "../models/user.model";

class LoginData {
  email: string;
  password: string;

  constructor(
    email: string,
    password: string
  ) {
    this.email = email;
    this.password = password;
  }
}

class SignupData extends LoginData {
  username: string;

  constructor(
    email: string,
    username: string,
    password: string
  ) {
    super(email, password)
    this.username = username;
  }
}

// регистрация пользователя
export const signup = async (
  email: string,
  username: string,
  password: string
) => {
  const authData = new SignupData(email, username, password);
  // проверка существования email
  const existingEmail = await User.findOne({ email: authData.email });
  if (existingEmail) {
    const error: ErrorWithStatus = new Error('E-Mail already exists. Please, try a different one.');
    error.statusCode = 401; // no authenticated
    throw error;
  }
  // зашифровка пароля
  const hashedPw = await hash(authData.password, 12);
  // создание нового пользователя
  const user = new User({
    email: authData.email,
    password: hashedPw,
    username: authData.username
  });
  const savedUser = await user.save();

  return savedUser._id.toString();
}

// авторизация
export const login = async (email: string, password: string) => {
  const loginData = new LoginData(email, password);
  const user = await User.findOne({ email: loginData.email });
  if (!user) {
    const error: ErrorWithStatus = new Error('No user with this email found.');
    error.statusCode = 401; // no authenticated
    throw error;
  }
  const isEqual = await compare(loginData.password, user.password);
  if (!isEqual) {
    const error: ErrorWithStatus = new Error('Password is incorrect.');
    error.statusCode = 401; // no authenticated
    throw error;
  }
  const token = jwtConfig({
    email: user.email,
    _id: user._id.toString()
  });
  // for exp time check in config/jwtToken.ts !!!
  const expirationTime = 24 * 3600000; // token lifetime (24h)

  return {
    token,
    expiresIn: expirationTime,
    userId: user._id.toString()
  }
}