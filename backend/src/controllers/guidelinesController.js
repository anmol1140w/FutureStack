import { ingestGuideline, getAllGuidelines, searchGuidelines } from '../services/ragService.js';

export async function createGuidelineHandler(req, res) {
  try {
    const { title, category, contentChunk, ruleType, patternRule } = req.body;

    if (!title || !category || !contentChunk) {
      return res.status(400).json({
        error: 'Missing required fields: title, category, and contentChunk are required.'
      });
    }

    const validCategories = ['TONE', 'TERMINOLOGY', 'CLAIM', 'LEGAL', 'PRIVACY'];
    if (!validCategories.includes(category.toUpperCase())) {
      return res.status(400).json({
        error: `Invalid category. Must be one of: ${validCategories.join(', ')}`
      });
    }

    const validRuleTypes = ['DETERMINISTIC', 'SEMANTIC'];
    const selectedRuleType = (ruleType || 'SEMANTIC').toUpperCase();
    if (!validRuleTypes.includes(selectedRuleType)) {
      return res.status(400).json({
        error: `Invalid ruleType. Must be one of: ${validRuleTypes.join(', ')}`
      });
    }

    const guideline = await ingestGuideline(
      title.trim(),
      category.toUpperCase(),
      contentChunk.trim(),
      selectedRuleType,
      patternRule ? patternRule.trim() : null
    );

    return res.status(201).json({
      message: 'Guideline created and indexed successfully.',
      guideline
    });
  } catch (error) {
    console.error('Error in createGuidelineHandler:', error);
    return res.status(500).json({ error: error.message });
  }
}

export async function getGuidelinesHandler(req, res) {
  try {
    const guidelines = await getAllGuidelines();
    return res.status(200).json({
      count: guidelines.length,
      guidelines
    });
  } catch (error) {
    console.error('Error in getGuidelinesHandler:', error);
    return res.status(500).json({ error: error.message });
  }
}

export async function searchGuidelinesHandler(req, res) {
  try {
    const { q, topK } = req.query;
    if (!q) {
      return res.status(400).json({ error: 'Query parameter "q" is required.' });
    }

    const limit = topK ? parseInt(topK, 10) : 3;
    const results = await searchGuidelines(q, limit);
    return res.status(200).json({ results });
  } catch (error) {
    console.error('Error in searchGuidelinesHandler:', error);
    return res.status(500).json({ error: error.message });
  }
}
