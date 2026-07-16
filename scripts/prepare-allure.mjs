/**
 * Copies allure/categories.json into allure-results/ before report generation so
 * Allure classifies failures into triage buckets (product defect vs test defect vs
 * infrastructure/timeout). Runs cross-platform (Windows/Linux) — no shell `cp`.
 */
import { cpSync, existsSync, mkdirSync } from 'node:fs';

const CATEGORIES = 'allure/categories.json';
const RESULTS_DIR = 'allure-results';

if (!existsSync(RESULTS_DIR)) mkdirSync(RESULTS_DIR, { recursive: true });

if (existsSync(CATEGORIES)) {
  cpSync(CATEGORIES, `${RESULTS_DIR}/categories.json`);
  console.info(`Copied ${CATEGORIES} -> ${RESULTS_DIR}/categories.json`);
} else {
  console.warn(`No ${CATEGORIES} found — skipping Allure categories.`);
}
