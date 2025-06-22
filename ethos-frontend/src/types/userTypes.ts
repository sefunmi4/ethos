
/**
 * Represents a registered user in the system.
 */
export interface User {
  id: string;
  email: string;
  username: string;
  password: string;
  role: UserRole;

  // Personal & social metadata
  name?: string;
  bio: string;
  avatarUrl?: string;
  tags: string[];
  location?: string;

  /**
   * Total experience points accumulated by the user.
   */
  xp?: number;

  gitAccounts?: GitAccount[];

  // Public-facing links and portfolio sites
  links: {
    github?: string;
    linkedin?: string;
    twitter?: string;
    tiktok?: string;
    youtube?: string;
    website?: string;
    blog?: string;
    other?: string;
  };

  // Public posts or linked external highlights
  featuredPosts?: {
    title: string;
    url: string;
    type?: 'github' | 'tweet' | 'blog' | 'quest' | 'video';
    tags?: string[];
  }[];

  // Timeline for experience/quests
  experienceTimeline: UserExperienceEvent[];

  // Optional system metadata (for moderation, status, etc.)
  status?: 'active' | 'archived' | 'banned';
  createdAt?: string;
  updatedAt?: string;
}

export interface GitAccount {
  provider: 'github' | 'gitlab';
  username: string;
  tokenHash?: string;
  linkedRepoIds?: string[];
}



/**
 * Represents a simplified or partial version of a user for auth sessions.
 * Includes extensions like `name` or session-specific metadata.
 */
export interface AuthUser extends Partial<Omit<User, 'role'>> {
  id: string;
  email: string;
  role?: UserRole;
  name?: string;
  [key: string]: unknown;
}

/**
 * Valid user roles within the system.
 */
export type UserRole = 'user' | 'admin' | 'moderator';



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
