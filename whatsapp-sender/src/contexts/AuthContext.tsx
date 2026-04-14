import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User, userService } from '@/services/userService';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isUnitAdmin: boolean;
  userHospitals: string[]; // Hospital IDs the user has access to
  hasHospitalAccess: (hospitalId: string | null | undefined) => boolean; // Check if user can access a hospital
  filterByUserHospitals: <T extends { hospital_id?: string | null }>(items: T[]) => T[]; // Filter items by user's hospitals
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'whatsapp_sender_auth';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored session on mount
    const storedAuth = localStorage.getItem(AUTH_STORAGE_KEY);
    if (storedAuth) {
      try {
        const parsedUser = JSON.parse(storedAuth) as User;
        // Verify user still exists and is active
        userService.getById(parsedUser.id).then((freshUser) => {
          if (freshUser && freshUser.is_active) {
            setUser(freshUser);
          } else {
            localStorage.removeItem(AUTH_STORAGE_KEY);
          }
          setIsLoading(false);
        });
      } catch {
        localStorage.removeItem(AUTH_STORAGE_KEY);
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    const authenticatedUser = await userService.login(email, password);
    if (authenticatedUser) {
      setUser(authenticatedUser);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authenticatedUser));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  // Get user's hospitals (admin has access to all)
  const userHospitals = user?.hospitals || [];
  const isAdmin = user?.role === 'admin';
  const isUnitAdmin = user?.role === 'unit_admin';

  // Check if user has access to a specific hospital
  const hasHospitalAccess = useCallback((hospitalId: string | null | undefined): boolean => {
    // Admin has access to everything
    if (isAdmin) return true;
    // If no hospital ID specified, allow (for backward compatibility)
    if (!hospitalId) return true;
    // Check if user has access to this hospital
    return userHospitals.includes(hospitalId);
  }, [isAdmin, userHospitals]);

  // Filter items by user's hospitals
  const filterByUserHospitals = useCallback(<T extends { hospital_id?: string | null }>(items: T[]): T[] => {
    // Admin sees everything
    if (isAdmin) return items;
    // Filter by user's hospitals
    return items.filter(item => {
      // If item has no hospital, show it (backward compatibility)
      if (!item.hospital_id) return true;
      // Check if user has access to this hospital
      return userHospitals.includes(item.hospital_id);
    });
  }, [isAdmin, userHospitals]);

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    logout,
    isAuthenticated: !!user,
    isAdmin,
    isUnitAdmin,
    userHospitals,
    hasHospitalAccess,
    filterByUserHospitals,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
