/**
 * Creates a reusable currency formatter for Indian Rupees.
 *
 * "en-IN" applies Indian number formatting conventions,
 * such as thousands, lakhs, and crores grouping.
 */
export const currencyFormatter = new Intl.NumberFormat("en-IN", {
  // Format the number as a currency instead of a plain number.
  style: "currency",

  // Specify Indian Rupees (ISO currency code).
  currency: "INR",

  // Display a maximum of 2 digits after the decimal point.
  // Extra decimal digits will be rounded.
  maximumFractionDigits: 2,
});

/**
 * Formats a price into Indian Rupee currency format.
 *
 * @param value - The price to format. Accepts either a string or a number.
 * @returns The formatted price string, such as "₹1,299.50".
 */
export function formatPrice(value: string | number) {
  // Convert the incoming value to a number,
  // then format it using our configured currency formatter.
  return currencyFormatter.format(Number(value));
}
