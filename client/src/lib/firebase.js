/**
 * firebase.js — STUB
 *
 * Firebase has been removed from EcoXchange.
 * Authentication is now handled entirely by the local backend:
 *   Email + Password  →  POST /api/auth/login
 *   Phone OTP         →  POST /api/auth/send-otp + /api/auth/verify-otp
 *
 * This file is kept to prevent import errors from any code that has not yet
 * been migrated. It exports null-safe stubs.
 */

export const firebaseAuth = null;
