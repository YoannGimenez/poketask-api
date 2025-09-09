import mongoose, { Schema, Document } from 'mongoose';

export interface ActionLog {
    route: string;
    method: string;
    success: boolean;
    body?: any;
    error?: string;
    timestamp: Date;
}

export interface UserLogDocument extends Document {
    userId?: string;
    date: string;
    actions: ActionLog[];
}

const ActionLogSchema = new Schema<ActionLog>({
    route: { type: String, required: true },
    success: { type: Boolean, required: true },
    body: { type: Schema.Types.Mixed },
    error: { type: String },
    timestamp: { type: Date, default: Date.now },
});

const UserLogSchema = new Schema<UserLogDocument>({
    userId: { type: String },
    date: { type: String, required: true }, // format YYYY-MM-DD
    actions: { type: [ActionLogSchema], default: [] },
});

// On crée un index pour userId + date unique
UserLogSchema.index({ userId: 1, date: 1 }, { unique: true });

export const UserLog = mongoose.model<UserLogDocument>('UserLog', UserLogSchema);
