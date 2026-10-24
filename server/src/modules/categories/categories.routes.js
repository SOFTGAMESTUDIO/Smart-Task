import { Router } from 'express';
import { z } from 'zod';
import { validateRequest } from '../../middleware/validateRequest.js';
import { getCategories, updateCategoryWeight } from './categories.controller.js';

const router = Router();

const updateWeightSchema = z.object({
  weight: z.coerce.number().min(1).max(5),
});

router.get('/', getCategories);
router.patch(
  '/:categoryId',
  validateRequest({ body: updateWeightSchema }),
  updateCategoryWeight
);

export default router;
