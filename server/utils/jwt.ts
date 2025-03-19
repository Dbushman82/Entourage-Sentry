import jwt from 'jsonwebtoken';

// Secret key for JWT signing (in a real app, this would be in an environment variable)
const JWT_SECRET = process.env.JWT_SECRET || 'entourage-sentry-secret-key';
const DEFAULT_EXPIRATION = '7d'; // Default token expiration time

export interface AssessmentTokenPayload {
  assessmentId: number;
  referenceCode: string;
  isPublicAccess: boolean;
}

/**
 * Generate a JWT token for assessment access
 * 
 * @param payload Assessment token data
 * @param expiresIn Expiration time (e.g., '1d', '7d', '30d')
 * @returns JWT token string
 */
export function generateAssessmentToken(
  payload: AssessmentTokenPayload, 
  expiresIn: string = DEFAULT_EXPIRATION
): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

/**
 * Verify and decode an assessment token
 * 
 * @param token JWT token to verify
 * @returns Decoded token payload or null if invalid
 */
export function verifyAssessmentToken(token: string): AssessmentTokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AssessmentTokenPayload;
    return decoded;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

/**
 * Generate a signed URL for public assessment access
 * 
 * @param assessmentId The assessment ID
 * @param referenceCode The assessment reference code
 * @param expiresIn Expiration time (e.g., '1d', '7d', '30d')
 * @returns Signed URL for accessing the assessment
 */
export function generateAssessmentUrl(
  assessmentId: number, 
  referenceCode: string, 
  expiresIn: string = DEFAULT_EXPIRATION
): string {
  const payload: AssessmentTokenPayload = {
    assessmentId,
    referenceCode,
    isPublicAccess: true
  };
  
  const token = generateAssessmentToken(payload, expiresIn);
  // In production, this would be the actual domain of the application
  const baseUrl = process.env.PUBLIC_URL || 'http://localhost:5000';
  
  return `${baseUrl}/assessment?token=${token}`;
}

/**
 * Calculate expiration date from duration string
 * 
 * @param duration Duration string (e.g., '1d', '7d', '30d')
 * @returns Date object representing the expiration date
 */
export function calculateExpirationDate(duration: string = DEFAULT_EXPIRATION): Date {
  const now = new Date();
  
  // Parse the duration string
  const match = duration.match(/^(\d+)([dhm])$/);
  if (!match) {
    throw new Error(`Invalid duration format: ${duration}. Expected format like "7d", "24h", "60m"`);
  }
  
  const [, value, unit] = match;
  const numValue = parseInt(value, 10);
  
  switch (unit) {
    case 'd': // Days
      now.setDate(now.getDate() + numValue);
      break;
    case 'h': // Hours
      now.setHours(now.getHours() + numValue);
      break;
    case 'm': // Minutes
      now.setMinutes(now.getMinutes() + numValue);
      break;
    default:
      throw new Error(`Unsupported duration unit: ${unit}`);
  }
  
  return now;
}