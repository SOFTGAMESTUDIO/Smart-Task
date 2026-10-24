import mongoose from 'mongoose';

const CategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    weight: { type: Number, min: 1, max: 5, default: 3 },
    color: { type: String, default: '#3b82f6' },
    icon: { type: String, default: 'Tag' },
    isSystem: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const CategoryModel = mongoose.models.Category || mongoose.model('Category', CategorySchema);
export default CategoryModel;
