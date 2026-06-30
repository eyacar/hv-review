import { clsx, type ClassValue } from 'clsx'

/** Merge conditional class names (BEM-style CSS classes in this project). */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs)
}
