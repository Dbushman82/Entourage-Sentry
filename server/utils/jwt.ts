import * as jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'entourage-sentry-secret-key';
const DEFAULT_EXPIRATION = '7d'; // Default expiration is 7 days

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
  const token = generateAssessmentToken(
    { assessmentId, referenceCode, isPublicAccess: true },
    expiresIn
  );
  
  // Get base URL from environment or use localhost for development
  const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
  
  return `${baseUrl}/assessment/${referenceCode}?token=${token}`;
}

/**
 * Calculate expiration date from duration string
 * 
 * @param duration Duration string (e.g., '1d', '7d', '30d')
 * @returns Date object representing the expiration date
 */
export function calculateExpirationDate(duration: string = DEFAULT_EXPIRATION): Date {
  const now = new Date();
  const unit = duration.slice(-1);
  const value = parseInt(duration.slice(0, -1));
  
  switch (unit) {
    case 'd':
      return new Date(now.setDate(now.getDate() + value));
    case 'h':
      return new Date(now.setHours(now.getHours() + value));
    case 'm':
      return new Date(now.setMinutes(now.getMinutes() + value));
    default:
      // Default to 7 days if format is invalid
      return new Date(now.setDate(now.getDate() + 7));
  }
}