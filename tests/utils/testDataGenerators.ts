/**
 * Generates a random email using timestamp + random suffix
 * Format: testuser_[timestamp]_[random]@[random].com
 */
export function generateRandomEmail(): string {
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  const randomDomain = Math.random().toString(36).substring(2, 8);
  
  return `testuser_${timestamp}_${randomSuffix}@${randomDomain}.com`;
}

/**
 * Generates a random 8-digit SG phone number starting with 8 or 9
 * Format: [8|9][7 random digits]
 */
export function generateRandomPhoneNumber(): string {
  const firstDigit = Math.random() < 0.5 ? 8 : 9;
  const remainingDigits = Array.from({ length: 7 }, () =>
    Math.floor(Math.random() * 10)
  ).join('');
  
  return `${firstDigit}${remainingDigits}`;
}