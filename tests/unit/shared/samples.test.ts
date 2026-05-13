import { describe, it, expect } from 'vitest';
import { SAMPLES, SAMPLE_CATEGORIES, getSamplesByCategory, getSampleById } from '../../../src/shared/samples';

describe('SAMPLES', () => {
  it('every sample has a non-empty id, name, code, and language', () => {
    for (const sample of SAMPLES) {
      expect(sample.id, `${sample.id} missing id`).toBeTruthy();
      expect(sample.name, `${sample.id} missing name`).toBeTruthy();
      expect(sample.code, `${sample.id} missing code`).toBeTruthy();
      expect(sample.language, `${sample.id} missing language`).toBeTruthy();
    }
  });

  it('every sample id is unique', () => {
    const ids = SAMPLES.map((s) => s.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('every sample category belongs to SAMPLE_CATEGORIES', () => {
    const validCategories = new Set<string>(SAMPLE_CATEGORIES);
    for (const sample of SAMPLES) {
      expect(
        validCategories.has(sample.category),
        `sample "${sample.id}" has unknown category "${sample.category}"`
      ).toBe(true);
    }
  });

  it('every SAMPLE_CATEGORIES entry has at least one sample', () => {
    for (const category of SAMPLE_CATEGORIES) {
      const samples = getSamplesByCategory(category);
      expect(samples.length, `category "${category}" has no samples`).toBeGreaterThan(0);
    }
  });

  it('getSamplesByCategory returns only matching samples', () => {
    for (const category of SAMPLE_CATEGORIES) {
      const samples = getSamplesByCategory(category);
      for (const sample of samples) {
        expect(sample.category).toBe(category);
      }
    }
  });

  it('getSampleById returns the correct sample', () => {
    const first = SAMPLES[0];
    const found = getSampleById(first.id);
    expect(found).toBeDefined();
    expect(found?.id).toBe(first.id);
    expect(found?.name).toBe(first.name);
  });

  it('getSampleById returns undefined for unknown id', () => {
    expect(getSampleById('does-not-exist')).toBeUndefined();
  });

  it('Progress Bar sample is in Long-Running Tasks', () => {
    const sample = getSampleById('sample-progress-bar');
    expect(sample, 'sample-progress-bar not found in SAMPLES').toBeDefined();
    expect(sample?.category).toBe('Long-Running Tasks');

    const longRunning = getSamplesByCategory('Long-Running Tasks');
    expect(longRunning.map((s) => s.id)).toContain('sample-progress-bar');
  });

  it('SVG Charts & Graphics sample is in Output Formats', () => {
    const sample = getSampleById('sample-svg-output');
    expect(sample, 'sample-svg-output not found in SAMPLES').toBeDefined();
    expect(sample?.category).toBe('Output Formats');

    const outputFormats = getSamplesByCategory('Output Formats');
    const ids = outputFormats.map((s) => s.id);
    expect(ids).toContain('sample-svg-output');
  });
});
