/**
 * Format a price amount as an Indian Rupee string
 * @param amount The price amount to format
 * @returns Formatted price string with ₹ symbol
 */
export const formatPrice = (amount: number | string): string => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '₹0';
  return `₹${num.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
};

/**
 * Format a price range
 * @param minPrice Minimum price
 * @param maxPrice Maximum price
 * @returns Formatted price range string (e.g., "₹1,000 - ₹5,000")
 */
export const formatPriceRange = (minPrice: number, maxPrice: number): string => {
  if (!minPrice && !maxPrice) return 'Price on request';
  if (minPrice === maxPrice) return formatPrice(minPrice);
  return `${formatPrice(minPrice)} - ${formatPrice(maxPrice)}`;
};
