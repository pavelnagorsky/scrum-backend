import { model, Schema } from 'mongoose';

export interface IUser {
  email: string;
  username: string;
  password: string;
};

const userSchema = new Schema<IUser>({
  email: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  username: {
    type: String,
    required: true
  }
});

export const User = model<IUser>('User', userSchema);