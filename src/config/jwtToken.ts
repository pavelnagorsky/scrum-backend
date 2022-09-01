import jwt from 'jsonwebtoken';

interface LoadedUser {
  email: string;
  _id: string;
}

export const jwtConfig = (loadedUser: LoadedUser) => {
  const token = jwt.sign(
    {
      email: loadedUser.email,
      userId: loadedUser._id
    },
    process.env.JWT_SECRET || '666',
    {
      expiresIn: "1d"
    }
  );
  return token;
}