/**
 * Represents a single experience or milestone entry in a user's timeline.
 */
export interface UserExperienceEvent {
  /**
   * ISO 8601 datetime string marking the event timestamp.
   * Example: "2025-06-01T12:00:00Z"
   */
  datetime: string;

  /**
   * Brief title or description of the event.
   * Example: "Joined SK Network"
   */
  title: string;

  /**
   * Optional tags to categorize or filter the event.
   * Example: ['education', 'achievement']
   */
  tags?: string[];
}

/**
 * Valid user roles within the system.
 */
export type UserRole = 'user' | 'admin' | 'moderator';

/**
 * Represents a registered user in the system.
 */
export interface User {
  /**
   * Unique user ID (UUID or database identifier).
   */
  id: string;

  /**
   * Public-facing username.
   */
  username: string;

  /**
   * Registered email address.
   */
  email: string;

  /**
   * User role used for authorization and access control.
   */
  role: UserRole;

  /**
   * User-defined tags indicating interests, skills, or identity.
   */
  tags: string[];

  /**
   * Self-written biography or description (can be markdown).
   */
  bio: string;

  /**
   * Social or portfolio links.
   */
  links: {
    github?: string;
    linkedin?: string;
    tiktok?: string;
    website?: string;
  };

  /**
   * Chronological record of user experience (for resumes, progress, etc).
   */
  experienceTimeline: UserExperienceEvent[];
}