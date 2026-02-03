// lib/spam-filter.js - Spam and Abuse Filter
/**
 * List of inappropriate words/phrases to filter
 * Add more words as needed
 */
const BANNED_WORDS = [
  // Turkish profanity
  'orospu', 'piç', 'göt', 'sik', 'am', 'yarrak', 'mal', 'aptal', 'salak', 'gerizekalı',
  'kafasız', 'beyinsiz', 'öksüz', 'it', 'köpek', 'hayvan', 'şerefsiz', 'namussuz',
  // English profanity
  'fuck', 'shit', 'damn', 'bitch', 'asshole', 'bastard', 'idiot', 'stupid', 'moron',
  'retard', 'dumb', 'crap', 'hell', 'piss', 'cunt', 'dick', 'pussy',
  // Common spam phrases (removed 'scam', 'fraud', 'fake' as they can be used legitimately in reviews)
  'spam', 'dolandırıcı', 'hile', 'aldatma',
  // Add more as needed
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

  const lowerText = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); // Remove accents
  
  for (const word of BANNED_WORDS) {
    const lowerWord = word.toLowerCase();
    // Check for whole word match (with word boundaries)
    const regex = new RegExp(`\\b${lowerWord}\\b`, 'i');
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
