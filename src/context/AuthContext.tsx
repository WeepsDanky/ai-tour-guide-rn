import React, { createContext, useState, useEffect, ReactNode, useContext } from 'react';
import * as SecureStore from 'expo-secure-store';
import { AuthUser, LogInUserResponse } from '@/types/auth'; 
import { login as apiLogin } from '@/services/auth.service';

const TOKEN_KEY = 'auth-token';
const USER_KEY = 'user-data'; 

interface AuthContextType {
  signIn: (username: string, password: string) => Promise<LogInUserResponse | undefined>;
  signOut: () => void;
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUserSession = async () => {
      try {
        const storedToken = await SecureStore.getItemAsync(TOKEN_KEY);
        const storedUser = await SecureStore.getItemAsync(USER_KEY);

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        }
      } catch (e) {
        console.error('Failed to load user session', e);
        // In case of error, ensure we are logged out
        setToken(null);
        setUser(null);
        await SecureStore.deleteItemAsync(TOKEN_KEY);
        await SecureStore.deleteItemAsync(USER_KEY);
      } finally {
        // A short delay helps prevent the splash screen from flickering
        // during the initial render.
        setTimeout(() => {
          setIsLoading(false);
        }, 1000);
      }
    };

    loadUserSession();
  }, []);

  const signIn = async (username: string, password:string) => {
    try {
      const response = await apiLogin(username, password);
      if (response && response.success && response.data) {
        const { accessToken } = response.data;
        const userData = response.data;

        setToken(accessToken);
        setUser(userData);
        
        // Securely store both the token and user data
        await SecureStore.setItemAsync(TOKEN_KEY, accessToken);
        await SecureStore.setItemAsync(USER_KEY, JSON.stringify(userData));
        
        return userData;
      }
    } catch (e) {
      console.error('Sign in failed', e);
      throw e;
    }
  };

  const signOut = async () => {
    setUser(null);
    setToken(null);
    
    // Clear both the token and user data from storage
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
  };



  return (
    <AuthContext.Provider value={{ signIn, signOut, user, token, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}