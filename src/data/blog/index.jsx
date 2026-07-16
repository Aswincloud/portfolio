/**
 * @file index.jsx
 * @author Aswin
 * @copyright © 2025 Aswin. All rights reserved.
 * @description Blog post registry. Each post is a module exporting `meta`
 *   (slug, title, description, date, readingTime, tags) and a default `Body`
 *   component. To add a post: create a new module under this folder and add it
 *   to POSTS below — the index page and routing pick it up automatically.
 */

import {
  meta as buildingThisPortfolioMeta,
  Body as BuildingThisPortfolioBody,
} from './building-this-portfolio.jsx';

// Newest first — this order is what the /blog index renders.
export const posts = [{ ...buildingThisPortfolioMeta, Body: BuildingThisPortfolioBody }];

export const getPost = slug => posts.find(p => p.slug === slug) || null;
