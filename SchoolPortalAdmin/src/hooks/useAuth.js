import { useState, useEffect } from 'react';
import {
  getToken,
  getCurrentUser,
  getCurrentUserId,
  getCurrentUserRole,
  isAuthenticated,
  isTokenValid,
  isTokenExpired,
  hasRole,
  isAdmin,
  isStudent,
  isTeacher,
  setupTokenRefresh,
  clearAuth
} from '../utils/tokenUtils';
import { axiosInstance } from '../CustomAxios';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [roleData, setRoleData] = useState(null);

  useEffect(() => {
    const initializeAuth = () => {
      const token = getToken();

      console.log({token})
      
      if (token && isTokenValid(token)) {
        const userInfo = getCurrentUser();
        console.log({userInfo})
        setUser(userInfo);
        setAuthenticated(true);
        
        // Setup token refresh
        setupTokenRefresh();
        
        // Get role-specific data if user is authenticated
        if (userInfo) {
          fetchRoleData(userInfo.id, userInfo.role);
        }
      } else {
        setUser(null);
        setAuthenticated(false);
        setRoleData(null);
      }
      
      setLoading(false);
    };

    const fetchRoleData = async (userId, role) => {
      try {
        const response = await axiosInstance.get('v1/user/my-role-id');
        if (response.data.status === 'SUCCESS') {
          setRoleData(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching role data:', error);
      }
    };

    initializeAuth();

    // Listen for storage changes (when token is updated)
    const handleStorageChange = (e) => {
      if (e.key === 'token') {
        initializeAuth();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const login = (token, userData) => {
    localStorage.setItem('token', token);
    if (userData) {
      localStorage.setItem('user', JSON.stringify(userData));
    }
    setUser(getCurrentUser());
    setAuthenticated(true);
    setupTokenRefresh();
  };

  const logout = () => {
    clearAuth();
    setUser(null);
    setAuthenticated(false);
    setRoleData(null);
  };

  const refreshUser = () => {
    const userInfo = getCurrentUser();
    setUser(userInfo);
    setAuthenticated(!!userInfo);
  };

  return {
    // User information
    user,
    userId: user?.id,
    userRole: user?.role,
    userName: user?.name,
    userEmail: user?.email,
    userPhone: user?.phone,
    emailVerified: user?.emailVerified,
    phoneVerified: user?.phoneVerified,
    userActive: user?.active,

    // Role-specific data
    roleData,
    studentId: roleData?.studentId,
    teacherId: roleData?.teacherId,
    studentName: roleData?.studentName,
    teacherName: roleData?.employeeName,

    // Authentication status
    authenticated,
    loading,
    isAuthenticated: () => isAuthenticated(),

    // Role checks
    isAdmin: () => isAdmin(),
    isStudent: () => isStudent(),
    isTeacher: () => isTeacher(),
    hasRole: (role) => hasRole(role),

    // Token utilities
    getToken: () => getToken(),
    isTokenValid: (token) => isTokenValid(token),
    isTokenExpired: (token) => isTokenExpired(token),

    // Actions
    login,
    logout,
    refreshUser,
  };
};

// Hook to get current user ID
export const useCurrentUserId = () => {
  const { userId } = useAuth();
  return userId;
};

// Hook to get current user role
export const useCurrentUserRole = () => {
  const { userRole } = useAuth();
  return userRole;
};

// Hook to check if user is admin
export const useIsAdmin = () => {
  const user = useAuth();
  console.log({user})
  return user?.role === 'admin';
};

// Hook to check if user is student
export const useIsStudent = () => {
  const { isStudent } = useAuth();
  return isStudent();
};

// Hook to check if user is teacher
export const useIsTeacher = () => {
  const { isTeacher } = useAuth();
  return isTeacher();
};

// Hook to get student ID (for student users)
export const useStudentId = () => {
  const { studentId, userRole } = useAuth();
  
  if (userRole === 'student') {
    return studentId;
  }
  
  return null;
};

// Hook to get teacher ID (for teacher users)
export const useTeacherId = () => {
  const { teacherId, userRole } = useAuth();
  
  if (userRole === 'teacher') {
    return teacherId;
  }
  
  return null;
};

// Hook to get role-specific data
export const useRoleData = () => {
  const { roleData } = useAuth();
  return roleData;
}; 