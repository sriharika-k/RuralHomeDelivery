// frontend/src/api.js
// Centralized API base URL for the frontend. Uses VITE_API_URL when provided
// and falls back to the local development URL for dev work.
const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:5000";

export default API_BASE;
