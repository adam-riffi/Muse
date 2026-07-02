// The single source of the backend base URL. Keeping it here (not inline in the client) lets URL
// builders and the network client share it without coupling the UI to either.
export const API_BASE: string = import.meta.env.VITE_API_BASE ?? '/api';
