import { model, Schema, Types } from 'mongoose';

export interface ITask {
	title: string;
	description: string;
	storyPoints: number;
	projectId: Types.ObjectId;
}

const taskSchema = new Schema<ITask>({
  title: {
		type: String,
		required: true
	},
  description: {
		type: String,
		required: true
	},
	storyPoints: {
		type: Number,
		required: true
	},
	projectId: {
		type: Schema.Types.ObjectId,
		ref: 'Project'
	}
}, { timestamps: true });

export const Task = model<ITask>("Task", taskSchema);