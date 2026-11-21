import { Router } from 'express';
import { categoryController } from './category.controller.js';
import { validateCategorySlug } from './slug.validation.middleware.js';

export const categoryRouter = Router();

categoryRouter.get('/', categoryController.listCategories);
categoryRouter.get('/:slug', validateCategorySlug, categoryController.getCategoryBySlug);
