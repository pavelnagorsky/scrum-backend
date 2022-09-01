import { model, Types, Schema } from 'mongoose';

export interface IIteration {
  title: string;
  deadline: Date;
  tasks: {
    "TODO": Types.ObjectId[],
    "DOING": Types.ObjectId[],
    "DONE": Types.ObjectId[]
  }
};

const iterationSchema = new Schema<IIteration>({
  title: {
    type: String,
    required: true
  },
  deadline: {
    type: Date,
    required: true
  },
  tasks: {
    'TODO': [{
      type: Schema.Types.ObjectId,
      ref: 'Task'
    }],
    'DOING': [{
      type: Schema.Types.ObjectId,
      ref: 'Task'
    }],
    'DONE': [{
      type: Schema.Types.ObjectId,
      ref: 'Task'
    }]
  }
}, { timestamps: true });

export const Iteration = model<IIteration>("Iteration", iterationSchema);