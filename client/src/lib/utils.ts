import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Calculate the Return on Investment (ROI) percentage
 * 
 * @param revenue The revenue generated
 * @param cost The cost of the investment/campaign
 * @returns The ROI as a percentage value (0-100)
 */
export function calculateROI(revenue: number, cost: number): number {
  if (cost === 0) return 0;
  return ((revenue - cost) / cost) * 100;
}

/**
 * Format a number as a currency string
 * 
 * @param value The number to format
 * @param currency The currency code to use (default: USD)
 * @param minimumFractionDigits Minimum number of decimal places (default: 0)
 * @param maximumFractionDigits Maximum number of decimal places (default: 0)
 * @returns Formatted currency string
 */
export function formatCurrency(
  value: number,
  currency = 'USD',
  minimumFractionDigits = 0,
  maximumFractionDigits = 0
): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(value);
}

/**
 * Format a number with commas as thousands separators
 * 
 * @param value The number to format
 * @returns Formatted number string
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

/**
 * Format a percentage value
 * 
 * @param value The percentage value (0-100)
 * @param minimumFractionDigits Minimum number of decimal places (default: 0)
 * @param maximumFractionDigits Maximum number of decimal places (default: 0)
 * @returns Formatted percentage string with % sign
 */
export function formatPercent(
  value: number,
  minimumFractionDigits = 0,
  maximumFractionDigits = 0
): string {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(value / 100);
}

/**
 * Truncate text to a specified length and add ellipsis
 * 
 * @param text The text to truncate
 * @param length Maximum length before truncation
 * @returns Truncated text with ellipsis if needed
 */
export function truncateText(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length) + '...';
}

/**
 * Get a readable date string from an ISO date
 * 
 * @param date ISO date string or Date object
 * @returns Formatted date string like "Jan 1, 2023"
 */
export function getReadableDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format a date to a specified format
 * 
 * @param date ISO date string or Date object
 * @param format Format pattern (default: 'MM/dd/yyyy')
 * @returns Formatted date string according to format
 */
export function formatDate(date: string | Date, format = 'MM/dd/yyyy'): string {
  const d = new Date(date);
  
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const year = d.getFullYear();
  
  return format
    .replace('MM', month.toString().padStart(2, '0'))
    .replace('dd', day.toString().padStart(2, '0'))
    .replace('yyyy', year.toString())
    .replace('yy', year.toString().slice(-2));
}

/**
 * Get a readable date and time string from an ISO date
 * 
 * @param date ISO date string or Date object
 * @returns Formatted date and time string
 */
export function getReadableDateTime(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}