import React, { createContext, useContext, useEffect, useState } from 'react';

interface User {
  uid: string;
  email: string;
  displayName: string;
  role: 'admin' | 'user';
  photoURL?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  userRole: 'admin' | 'user' | null;
  signOut: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string, ssn: string, phone: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAdmin: false,
  userRole: null,
  signOut: async () => {},
  signIn: async () => {},
  signUp: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userRole, setUserRole] = useState<'admin' | 'user' | null>(null);

  useEffect(() => {
    // Check for saved user in localStorage
    const savedUser = localStorage.getItem('new_age_user');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        setUserRole(parsedUser.role);
        setIsAdmin(parsedUser.role === 'admin');
      } catch (err) {
        console.error("Error parsing saved user:", err);
        localStorage.removeItem('new_age_user');
      }
    }
    setLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Login failed');
    }

    const { user: userData } = await response.json();
    setUser(userData);
    setUserRole(userData.role);
    setIsAdmin(userData.role === 'admin');
    localStorage.setItem('new_age_user', JSON.stringify(userData));
  };

  const signUp = async (email: string, password: string, name: string, ssn: string, phone: string) => {
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name, ssn, phone }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Signup failed');
    }

    const { user: userData } = await response.json();
    setUser(userData);
    setUserRole(userData.role);
    setIsAdmin(userData.role === 'admin');
    localStorage.setItem('new_age_user', JSON.stringify(userData));
  };

  const signOut = async () => {
    setUser(null);
    setUserRole(null);
    setIsAdmin(false);
    localStorage.removeItem('new_age_user');
  };

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, userRole, signOut, signIn, signUp }}>
      {children}
    </AuthContext.Provider>
  );
};
