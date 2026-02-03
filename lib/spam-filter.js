// lib/spam-filter.js - Spam and Abuse Filter
/**
 * List of inappropriate words/phrases to filter
 * Add more words as needed
 */
const BANNED_WORDS = [
  // Only the most offensive words - removed common words that can be used legitimately
  // Turkish profanity (most severe only)
  'orospu', 'piç', 'göt', 'sik', 'am', 'yarrak',
  // English profanity (most severe only)
  'fuck', 'shit', 'bitch', 'asshole', 'cunt', 'dick', 'pussy',
  // Note: Removed 'damn', 'hell', 'bastard', 'idiot', 'stupid', 'moron', 'retard', 'dumb', 'crap', 'piss'
  // as they can be used in legitimate reviews (e.g., "not stupid", "damn good", etc.)
  // Note: Removed 'spam', 'scam', 'fraud', 'fake' as they can be used legitimately in reviews
  // Note: Removed Turkish words like 'mal', 'aptal', 'salak' as they can be used in context
];

/**
 * Check if text contains banned words
 * @param {string} text - Text to check
 * @returns {boolean} - True if contains banned words
 */
export function containsBannedWords(text) {
  if (!text || typeof text !== 'string') {
    return false;
  }

  // Don't normalize - it can cause false positives
  const lowerText = text.toLowerCase();
  
  for (const word of BANNED_WORDS) {
    const lowerWord = word.toLowerCase();
    // Check for whole word match (with word boundaries) - case insensitive
    // Use word boundaries to avoid matching substrings
    const regex = new RegExp(`\\b${lowerWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (regex.test(lowerText)) {
      console.log(`[SPAM FILTER] Matched banned word: "${word}" in text: "${text.substring(0, 100)}..."`);
      return true;
    }
  }

  return false;
}

/**
 * Filter and clean text
 * @param {string} text - Text to filter
 * @returns {object} - {isValid: boolean, filteredText: string, reason: string}
 */
export function filterText(text) {
  if (!text || typeof text !== 'string') {
    return {
      isValid: false,
      filteredText: '',
      reason: 'Text is required'
    };
  }

  // Check length
  if (text.length > 300) {
    return {
      isValid: false,
      filteredText: text.substring(0, 300),
      reason: 'Text exceeds maximum length of 300 characters'
    };
  }

  // Check for banned words
  if (containsBannedWords(text)) {
    return {
      isValid: false,
      filteredText: text,
      reason: 'Text contains inappropriate content'
    };
  }

  // Trim whitespace
  const trimmedText = text.trim();

  if (trimmedText.length === 0) {
    return {
      isValid: false,
      filteredText: '',
      reason: 'Text cannot be empty'
    };
  }

  return {
    isValid: true,
    filteredText: trimmedText,
    reason: null
  };
}
