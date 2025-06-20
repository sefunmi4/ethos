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
  
    /** Logged-in user’s private profile page */
    PROFILE: '/profile',
  
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

    FLAGGED_QUESTS: '/admin/flagged-quests',
  
    /** Wildcard route for handling 404 pages */
    NOT_FOUND: '*',
  };