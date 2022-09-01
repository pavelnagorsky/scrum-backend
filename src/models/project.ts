import { model, Types, Schema } from 'mongoose';

export interface IQueue {
  userId: Types.ObjectId,
  username: string,
  email: string
};

export interface IProject {
  title: string;
  description: string;
  admin: Types.ObjectId;
  users: Types.ObjectId[];
  queue: IQueue[];
  backlog: Types.ObjectId[];
  iterations: Types.ObjectId[];
}

const projectSchema = new Schema<IProject>({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  admin: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  users: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  queue: [{
    userId : {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    username: String,
    email: String,
    _id: false
  }],
  backlog: [{
    type: Schema.Types.ObjectId,
    ref: 'Task'
  }],
  iterations: [{
    type: Schema.Types.ObjectId,
    ref: 'Iteration'
  }]
}, { timestamps: true });

export const Project = model<IProject>("Project", projectSchema);