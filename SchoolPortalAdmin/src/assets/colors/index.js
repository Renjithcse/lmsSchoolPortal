// Multi-Theme Color System
export const THEMES = {
  // Default Blue Theme
  default: {
    primary: '#2563eb',
    secondary: '#64748b',
    accent: '#3b82f6',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#06b6d4',
    
    // Background colors
    background: {
      primary: '#ffffff',
      secondary: '#f8fafc',
      tertiary: '#f1f5f9',
      dark: '#1e293b'
    },
    
    // Text colors
    text: {
      primary: '#1e293b',
      secondary: '#64748b',
      disabled: '#94a3b8',
      inverse: '#ffffff'
    },
    
    // Border colors
    border: {
      primary: '#e2e8f0',
      secondary: '#cbd5e1',
      focus: '#3b82f6'
    },
    
    // Sidebar colors
    sidebar: {
      background: '#ffffff',
      hover: '#f1f5f9',
      active: '#2563eb',
      text: '#1e293b',
      border: '#e2e8f0'
    },
    
    // Header colors
    header: {
      background: '#ffffff',
      border: '#e2e8f0',
      text: '#1e293b'
    }
  },

  // Dark Theme
  dark: {
    primary: '#3b82f6',
    secondary: '#94a3b8',
    accent: '#60a5fa',
    success: '#34d399',
    warning: '#fbbf24',
    error: '#f87171',
    info: '#22d3ee',
    
    background: {
      primary: '#0f172a',
      secondary: '#1e293b',
      tertiary: '#334155',
      dark: '#020617'
    },
    
    text: {
      primary: '#f8fafc',
      secondary: '#cbd5e1',
      disabled: '#64748b',
      inverse: '#0f172a'
    },
    
    border: {
      primary: '#334155',
      secondary: '#475569',
      focus: '#3b82f6'
    },
    
    sidebar: {
      background: '#1e293b',
      hover: '#334155',
      active: '#3b82f6',
      text: '#f8fafc',
      border: '#334155'
    },
    
    header: {
      background: '#1e293b',
      border: '#334155',
      text: '#f8fafc'
    }
  },

  // Green Theme
  green: {
    primary: '#059669',
    secondary: '#6b7280',
    accent: '#10b981',
    success: '#34d399',
    warning: '#fbbf24',
    error: '#f87171',
    info: '#22d3ee',
    
    background: {
      primary: '#ffffff',
      secondary: '#f0fdf4',
      tertiary: '#dcfce7',
      dark: '#064e3b'
    },
    
    text: {
      primary: '#064e3b',
      secondary: '#6b7280',
      disabled: '#9ca3af',
      inverse: '#ffffff'
    },
    
    border: {
      primary: '#d1fae5',
      secondary: '#a7f3d0',
      focus: '#059669'
    },
    
    sidebar: {
      background: '#ffffff',
      hover: '#f0fdf4',
      active: '#059669',
      text: '#064e3b',
      border: '#d1fae5'
    },
    
    header: {
      background: '#ffffff',
      border: '#d1fae5',
      text: '#064e3b'
    }
  },

  // Purple Theme
  purple: {
    primary: '#7c3aed',
    secondary: '#8b5cf6',
    accent: '#a855f7',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#06b6d4',
    
    background: {
      primary: '#ffffff',
      secondary: '#faf5ff',
      tertiary: '#f3e8ff',
      dark: '#581c87'
    },
    
    text: {
      primary: '#581c87',
      secondary: '#6b7280',
      disabled: '#9ca3af',
      inverse: '#ffffff'
    },
    
    border: {
      primary: '#e9d5ff',
      secondary: '#d8b4fe',
      focus: '#7c3aed'
    },
    
    sidebar: {
      background: '#ffffff',
      hover: '#faf5ff',
      active: '#7c3aed',
      text: '#581c87',
      border: '#e9d5ff'
    },
    
    header: {
      background: '#ffffff',
      border: '#e9d5ff',
      text: '#581c87'
    }
  },

  // Orange Theme
  orange: {
    primary: '#ea580c',
    secondary: '#f97316',
    accent: '#fb923c',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#06b6d4',
    
    background: {
      primary: '#ffffff',
      secondary: '#fff7ed',
      tertiary: '#fed7aa',
      dark: '#9a3412'
    },
    
    text: {
      primary: '#9a3412',
      secondary: '#6b7280',
      disabled: '#9ca3af',
      inverse: '#ffffff'
    },
    
    border: {
      primary: '#fed7aa',
      secondary: '#fdba74',
      focus: '#ea580c'
    },
    
    sidebar: {
      background: '#ffffff',
      hover: '#fff7ed',
      active: '#ea580c',
      text: '#9a3412',
      border: '#fed7aa'
    },
    
    header: {
      background: '#ffffff',
      border: '#fed7aa',
      text: '#9a3412'
    }
  }
};

// Legacy support - keep the old COLORS object for backward compatibility
export const COLORS = THEMES.green;

// Theme context and utilities
export const getThemeColors = (themeName = 'default') => {
  return THEMES[themeName] || THEMES.default;
};

export const getThemeNames = () => {
  return Object.keys(THEMES);
};

// Export individual theme colors for direct access
export const { default: DEFAULT_THEME } = THEMES;
export const { dark: DARK_THEME } = THEMES;
export const { green: GREEN_THEME } = THEMES;
export const { purple: PURPLE_THEME } = THEMES;
export const { orange: ORANGE_THEME } = THEMES; 
