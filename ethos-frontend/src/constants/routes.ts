// src/constants/routes.ts

/**
 * Centralized route paths used throughout the application.
 * Supports both static and dynamic route generators for cleaner, type-safe navigation.
 */
export const ROUTES = {
    /** Root landing page (public) */
    HOME: '/',
  
    /** Login page (public) */
    LOGIN: '/login',

    /** Informational about page */
    ABOUT: '/about',

    /** Privacy policy page */
    PRIVACY: '/privacy',

    /** Terms of service page */
    TERMS: '/terms',
  
    /** Logged-in user’s private profile page */
    PROFILE: '/profile',

    /** Notifications page */
    NOTIFICATIONS: '/notifications',
  
    /**
     * Public profile page for any user
     * @param userId - The user’s unique ID (e.g., from database or wallet)
     * @returns A route string like `/user/abc123`
     */
    PUBLIC_PROFILE: (userId = ':userId') => `/user/${userId}`,
  
    /**
     * Password reset page
     * @param token - Unique reset token sent via email
     * @returns A route string like `/reset-password/token123`
     */
    RESET_PASSWORD: (token = ':token') => `/reset-password/${token}`,

    /**
     * Quest page by ID (private)
     * @param id - Quest ID
     * @returns A route string like `/quest/abc123`
     */
    QUEST: (id = ':id') => `/quest/${id}`,

    /**
     * Project page by ID
     * @param id - Project ID
     */
    PROJECT: (id = ':id') => `/project/${id}`,
  
    /**
     * Post page by ID (private)
     * @param id - Post ID
     * @returns A route string like `/post/abc123`
     */
    POST: (id = ':id') => `/post/${id}`,
  
    /**
     * Board page by ID (private)
     * @param id - Board ID
     * @returns A route string like `/boards/abc123`
     */
    BOARD: (id = ':id') => `/boards/${id}`,

    /**
     * Quest team page listing collaborators
     * @param questId - Quest ID
     * @returns Route like `/board/team-abc123`
     */
    TEAM_BOARD: (questId = ':questId') => `/board/team-${questId}`,

    /**
     * Listing page for a board type
     * @param boardType - board category
     * @returns A route string like `/board/quests`
     */
    BOARD_TYPE: (boardType = ':boardType') => `/board/${boardType}`,

    /**
     * Review summary page
     * @param entityType Entity type being reviewed
     * @param id Entity ID
     */
    REVIEW_SUMMARY: (
      entityType = ':entityType',
      id = ':id',
    ) => `/reviews/${entityType}/${id}`,

    FLAGGED_QUESTS: '/admin/flagged-quests',
    BANNED_QUESTS: '/admin/banned-quests',

    /** Wildcard route for handling 404 pages */
    NOT_FOUND: '*',
  };