import { jwtDecode } from 'jwt-decode';
import Cookies from "js-cookie";

// Get token from localStorage or cookies
export const getToken = () => {
  return localStorage.getItem('token') || Cookies.get('access');
};

// Decode JWT token
export const decodeToken = (token) => {
  try {
    return jwtDecode(token);
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

// Extract user information from token
export const extractUserFromToken = (token) => {
  const decoded = decodeToken(token);
  if (!decoded) return null;

  console.log({decoded})
  return {
    id: decoded.id,
    email: decoded.email,
    role: decoded.role,
    name: decoded.name,
    phone: decoded.phone,
    emailVerified: decoded.emailVerified,
    phoneVerified: decoded.phoneVerified,
    active: decoded.active
  };
};

// Get current user ID from token
export const getCurrentUserId = () => {
  const token = getToken();
  if (!token) return null;
  
  const decoded = decodeToken(token);
  return decoded?.id || null;
};

// Get current user role from token
export const getCurrentUserRole = () => {
  const token = getToken();
  if (!token) return null;
  
  const decoded = decodeToken(token);
  return decoded?.role || null;
};

// Get current user information from token
export const getCurrentUser = () => {
  const token = getToken();
  if (!token) return null;
  
  return extractUserFromToken(token);
};

// Check if token is valid
export const isTokenValid = (token) => {
  if (!token) return false;
  
  try {
    const decoded = jwtDecode(token);
    const currentTime = Date.now() / 1000;
    return decoded.exp > currentTime;
  } catch (error) {
    return false;
  }
};

// Check if user is authenticated
export const isAuthenticated = () => {
  const token = getToken();
  return token && isTokenValid(token);
};

// Get token expiration time
export const getTokenExpiration = (token) => {
  if (!token) return null;
  
  try {
    const decoded = jwtDecode(token);
    return new Date(decoded.exp * 1000);
  } catch (error) {
    return null;
  }
};

// Check if token is expired
export const isTokenExpired = (token) => {
  if (!token) return true;
  
  try {
    const decoded = jwtDecode(token);
    const currentTime = Date.now() / 1000;
    return decoded.exp < currentTime;
  } catch (error) {
    return true;
  }
};

// Get time until token expires (in seconds)
export const getTimeUntilExpiration = (token) => {
  if (!token) return 0;
  
  try {
    const decoded = jwtDecode(token);
    const currentTime = Date.now() / 1000;
    return Math.max(0, decoded.exp - currentTime);
  } catch (error) {
    return 0;
  }
};

// Format token expiration time
export const formatTokenExpiration = (token) => {
  const expiration = getTokenExpiration(token);
  if (!expiration) return 'Invalid token';
  
  return expiration.toLocaleString();
};

// Get user role from token
export const getUserRoleFromToken = (token) => {
  const decoded = decodeToken(token);
  return decoded?.role || null;
};

// Check if user has specific role
export const hasRole = (role) => {
  const currentRole = getCurrentUserRole();
  return currentRole === role;
};

// Check if user is admin
export const isAdmin = () => {
  return hasRole('admin');
};

// Check if user is student
export const isStudent = () => {
  return hasRole('student');
};

// Check if user is teacher
export const isTeacher = () => {
  return hasRole('teacher');
};

// Get user permissions from token (if available)
export const getUserPermissions = (token) => {
  const decoded = decodeToken(token);
  return decoded?.permissions || [];
};

// Check if user has specific permission
export const hasPermission = (permission) => {
  const token = getToken();
  if (!token) return false;
  
  const permissions = getUserPermissions(token);
  return permissions.includes(permission);
};

// Utility to refresh token (placeholder for actual implementation)
export const refreshToken = async () => {
  try {
    const response = await fetch('/api/v1/auth/refresh', {
      method: 'GET',
      credentials: 'include',
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.accessToken) {
        localStorage.setItem('token', data.accessToken);
        return data.accessToken;
      }
    }
  } catch (error) {
    console.error('Error refreshing token:', error);
  }
  
  return null;
};

// Auto-refresh token if it's about to expire
export const setupTokenRefresh = () => {
  const token = getToken();
  if (!token) return;
  
  const timeUntilExpiration = getTimeUntilExpiration(token);
  const fiveMinutes = 5 * 60; // 5 minutes in seconds
  
  if (timeUntilExpiration > 0 && timeUntilExpiration < fiveMinutes) {
    // Token expires in less than 5 minutes, refresh it
    setTimeout(async () => {
      const newToken = await refreshToken();
      if (newToken) {
        console.log('Token refreshed successfully');
      } else {
        console.log('Failed to refresh token, redirecting to login');
        window.location.href = '/login';
      }
    }, (timeUntilExpiration - 60) * 1000); // Refresh 1 minute before expiration
  }
};

// Clear all authentication data
export const clearAuth = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  // Clear cookies
  document.cookie = 'access=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  document.cookie = 'refresh=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
}; 