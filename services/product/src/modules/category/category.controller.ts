import type { NextFunction, Request, Response } from 'express';

import { categoryService } from './category.service.js';

// ---------------------------------------------
// Category Controller
// ---------------------------------------------
// This file handles HTTP requests for category endpoints.
//
// Responsibilities:
// - Read request parameters.
// - Call the category service.
// - Send JSON responses.
// - Forward errors to the global error middleware.
//
// Business logic belongs in the service.
// Database queries belong in the repository.
// ---------------------------------------------

export const categoryController = {
  /**
   * GET /api/categories
   *
   * Returns all active categories.
   */
  async listCategories(_req: Request, res: Response, next: NextFunction) {
    try {
      // Fetch categories from the service layer.
      const categories = await categoryService.listCategories();

      // Return the successful API response.
      return res.status(200).json({
        success: true,
        data: categories,
      });
    } catch (error) {
      // Forward the error to the centralized error handler.
      return next(error);
    }
  },

  /**
   * GET /api/categories/:slug
   *
   * Returns a single active category matching the slug.
   */
  async getCategoryBySlug(req: Request<{ slug: string }>, res: Response, next: NextFunction) {
    try {
      // Extract the category slug from the URL.
      const { slug } = req.params;

      // Retrieve the category through the service layer.
      const category = await categoryService.getCategoryBySlug(slug);

      // Return the successful API response.
      return res.status(200).json({
        success: true,
        data: category,
      });
    } catch (error) {
      // This also forwards CategoryNotFoundError to error middleware.
      return next(error);
    }
  },
};
