// utils/formatUtils.js

/**
 * Capitalizes the first letter of a string
 * @example capitalize('hello') => "Hello"
 */
export function capitalize(str = '') {
    if (typeof str !== 'string') return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
  
  /**
   * Truncates text to a specified length and adds an ellipsis
   * @example truncate('This is long', 5) => "This …"
   */
  export function truncate(str = '', maxLength = 100) {
    if (!str || typeof str !== 'string') return '';
    return str.length > maxLength ? str.slice(0, maxLength) + '…' : str;
  }
  
  /**
   * Slugifies a string for URLs or IDs
   * @example slugify('This Is A Title!') => "this-is-a-title"
   */
  export function slugify(str = '') {
    return str
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')         // Remove punctuation
      .replace(/\s+/g, '-')             // Replace spaces with dashes
      .replace(/-+/g, '-');             // Collapse multiple dashes
  }
  
  /**
   * Converts camelCase or snake_case to human readable
   * @example humanize('quest_log') => "Quest Log"
   * @example humanize('questLog') => "Quest Log"
   */
  export function humanize(str = '') {
    return capitalize(
      str
        .replace(/_/g, ' ')
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .toLowerCase()
    );
  }