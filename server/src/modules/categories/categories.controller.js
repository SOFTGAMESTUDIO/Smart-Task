import mongoose from 'mongoose';
import CategoryModel from '../../database/models/Category.js';
import { setCategoryWeightCache } from '../tasks/tasks.service.js';

const defaultCategories = [
  { id: 'cat-1', name: 'Home & Family Responsibilities', weight: 5, color: '#10b981' },
  { id: 'cat-2', name: 'Delivery Assignments', weight: 5, color: '#f59e0b' },
  { id: 'cat-3', name: 'Office Work', weight: 4, color: '#3b82f6' },
  { id: 'cat-4', name: 'Freelance Coding', weight: 3, color: '#6366f1' },
  { id: 'cat-5', name: 'Personal Errands & Shopping', weight: 2, color: '#a855f7' },
  { id: 'cat-6', name: 'Education', weight: 3, color: '#06b6d4' },
];

let inMemoryCategories = [...defaultCategories];

export const getCategories = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState === 1) {
      let categories = await CategoryModel.find().sort({ weight: -1, name: 1 }).lean();
      if (categories.length === 0) {
        // Seed default system categories if empty
        await CategoryModel.insertMany(
          defaultCategories.map((c) => ({
            name: c.name,
            weight: c.weight,
            color: c.color,
            isSystem: true,
          }))
        );
        categories = await CategoryModel.find().sort({ weight: -1, name: 1 }).lean();
      }
      return res.status(200).json({ success: true, data: categories });
    }

    // Sync weight map into the deterministic priority engine
    const weightMap = inMemoryCategories.reduce((m, c) => {
      m[c.name] = c.weight;
      return m;
    }, {});
    setCategoryWeightCache(weightMap);

    res.status(200).json({ success: true, data: inMemoryCategories });
  } catch (error) {
    next(error);
  }
};

export const updateCategoryWeight = async (req, res, next) => {
  try {
    const { categoryId } = req.params;
    const { weight } = req.body;

    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(categoryId)) {
      const updated = await CategoryModel.findByIdAndUpdate(
        categoryId,
        { weight },
        { new: true }
      ).lean();
      return res.status(200).json({ success: true, data: updated });
    }

    const idx = inMemoryCategories.findIndex((c) => c.id === categoryId);
    if (idx !== -1) {
      inMemoryCategories[idx].weight = weight;
      // Refresh weight map in priority engine
      const weightMap = inMemoryCategories.reduce((m, c) => { m[c.name] = c.weight; return m; }, {});
      setCategoryWeightCache(weightMap);
      return res.status(200).json({ success: true, data: inMemoryCategories[idx] });
    }

    res.status(404).json({
      success: false,
      error: { code: 'CATEGORY_NOT_FOUND', message: 'Category not found' },
    });
  } catch (error) {
    next(error);
  }
};
