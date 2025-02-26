import {DocumentType} from './types/document';
import {flag} from 'country-emoji';

// Priority countries order
export const PRIORITY_COUNTRIES = [
  'United States',
  'United Kingdom',
  'Australia',
  'China',
  'Canada',
];

/**
 * Gets flag emoji for a country name
 * @param countryName Full country name
 * @returns Flag emoji string or empty string if not found
 */
export function getCountryFlag(countryName: string): string {
  const emoji = flag(countryName);
  return emoji || '';
}

/**
 * Sorts document types with priority countries first, then alphabetically
 * @param documents Array of document types to sort
 * @returns Sorted array of document types
 */
export function sortDocuments(documents: DocumentType[]): DocumentType[] {
  return [...documents].sort((a, b) => {
    const countryA = a.country;
    const countryB = b.country;

    // Get priority indices (-1 if not in priority list)
    const priorityA = PRIORITY_COUNTRIES.indexOf(countryA);
    const priorityB = PRIORITY_COUNTRIES.indexOf(countryB);

    // If both countries are in priority list, sort by priority
    if (priorityA !== -1 && priorityB !== -1) {
      return priorityA - priorityB;
    }

    // If only one country is in priority list, it should come first
    if (priorityA !== -1) return -1;
    if (priorityB !== -1) return 1;

    // For non-priority countries, sort alphabetically
    return countryA.localeCompare(countryB);
  });
}
