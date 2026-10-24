import mongoose from 'mongoose';

const SubtaskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },
    category: { type: String, default: 'General' },
    priority: {
      type: String,
      enum: ['Critical', 'High', 'Medium', 'Low'],
      default: 'Medium',
    },
    status: {
      type: String,
      enum: ['inbox', 'draft', 'todo', 'in_progress', 'blocked', 'completed', 'cancelled'],
      default: 'todo',
    },
    estimatedMinutes: { type: Number, default: 30 },
    actualMinutes: { type: Number, default: 0 },
    dueAt: { type: Date, default: null },
    dependencies: [{ type: String }],
    completionCriteria: { type: String, default: '' },
    completedAt: { type: Date, default: null },
  },
  { _id: true, timestamps: true }
);

const TaskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },
    category: { type: String, default: 'General', index: true },
    priority: {
      type: String,
      enum: ['Critical', 'High', 'Medium', 'Low'],
      default: 'Medium',
      index: true,
    },
    prioritySource: {
      type: String,
      enum: ['user_override', 'deterministic_engine', 'ai_suggested', 'ai_approved', 'manual'],
      default: 'manual',
    },
    status: {
      type: String,
      enum: ['inbox', 'draft', 'todo', 'in_progress', 'blocked', 'completed', 'cancelled'],
      default: 'todo',
      index: true,
    },
    dueAt: { type: Date, default: null, index: true },
    estimatedMinutes: { type: Number, default: 60 },
    actualMinutes: { type: Number, default: 0 },
    subtasks: [SubtaskSchema],
    dependencies: [{ type: String }],
    isAiGenerated: { type: Boolean, default: false },
    isApproved: { type: Boolean, default: true },
    recommendationReason: { type: String, default: '' },
    ownerId: { type: String, default: 'user-default', index: true },
    completedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  }
);

// Helpful index for dashboard ordering
TaskSchema.index({ status: 1, dueAt: 1, priority: 1 });

export const TaskModel = mongoose.models.Task || mongoose.model('Task', TaskSchema, 'aitaskmanagement');
export default TaskModel;
