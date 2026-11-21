export const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});


export function formatPrice(value: string | number) {
  return currencyFormatter.format(Number(value));
}
