import { dbAll, dbGet, dbRun } from '../../config/database.js';
import { setCategoryWeightCache } from '../tasks/tasks.service.js';

export const getCategories = async (req, res, next) => {
  try {
    const rows = await dbAll('SELECT * FROM categories ORDER BY weight DESC, name ASC');

    const categories = rows.map((c) => ({
      ...c,
      _id: c.id,
      id: c.id,
      isSystem: Boolean(c.isSystem),
    }));

    // Sync weight map into the deterministic priority engine
    const weightMap = categories.reduce((m, c) => {
      m[c.name] = c.weight;
      return m;
    }, {});
    setCategoryWeightCache(weightMap);

    res.status(200).json({ success: true, data: categories });
  } catch (error) {
    next(error);
  }
};

export const updateCategoryWeight = async (req, res, next) => {
  try {
    const { categoryId } = req.params;
    const { weight } = req.body;

    const existing = await dbGet('SELECT * FROM categories WHERE id = ?', [categoryId]);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: { code: 'CATEGORY_NOT_FOUND', message: 'Category not found' },
      });
    }

    const now = new Date().toISOString();
    await dbRun('UPDATE categories SET weight = ?, updatedAt = ? WHERE id = ?', [weight, now, categoryId]);

    const updated = await dbGet('SELECT * FROM categories WHERE id = ?', [categoryId]);

    // Refresh weight cache
    const all = await dbAll('SELECT * FROM categories');
    const weightMap = all.reduce((m, c) => {
      m[c.name] = c.weight;
      return m;
    }, {});
    setCategoryWeightCache(weightMap);

    return res.status(200).json({
      success: true,
      data: {
        ...updated,
        _id: updated.id,
        id: updated.id,
        isSystem: Boolean(updated.isSystem),
      },
    });
  } catch (error) {
    next(error);
  }
};
