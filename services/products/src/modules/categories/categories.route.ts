import { Router } from 'express';

import { listCategoriesController, getCategoryBySlugController } from './categories.controller.js';
import { validateCategorySlug } from './categories.validation.js';

const categoryRouter = Router();

categoryRouter.get('/', listCategoriesController);

categoryRouter.get('/:slug', validateCategorySlug, getCategoryBySlugController);

export default categoryRouter;
