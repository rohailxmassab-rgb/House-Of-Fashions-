import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number, currency: string = 'USD') {
  const validCurrency = (currency && currency.trim()) ? currency : 'USD';
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: validCurrency,
    }).format(price);
  } catch (e) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  }
}
