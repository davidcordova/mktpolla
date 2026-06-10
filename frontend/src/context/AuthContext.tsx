// frontend/src/context/AuthContext.tsx

import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

interface User {
    id: number;
    name: string;
    email: string;
    avatar_url: string | null;
    country: string | null;
    favorite_team: string | null;
    is_admin: boolean;
    points_total: number;
    hits_total: number;
    champion_predicted_id: string | null;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    loading: boolean;
    login: (credentials: any) => Promise<void>;
    loginSocial: (provider: string, name: string, email: string, avatarUrl: string) => Promise<void>;
    register: (userData: any) => Promise<void>;
    logout: () => void;
    updateUser: (updatedUser: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const loadStoredAuth = async () => {
            const storedToken = localStorage.getItem('polla_token');
            const storedUser = localStorage.getItem('polla_user');
            
            if (storedToken && storedUser) {
                setToken(storedToken);
                setUser(JSON.parse(storedUser));
                
                // Proactively refresh profile stats
                try {
                    const response = await api.getProfile();
                    if (response.status === 'success') {
                        setUser(response.user);
                        localStorage.setItem('polla_user', JSON.stringify(response.user));
                    }
                } catch (err) {
                    console.error('Error refreshing session:', err);
                    // If unauthorized, clear session
                    if (err instanceof Error && err.message.includes('Unauthorized')) {
                        logout();
                    }
                }
            }
            setLoading(false);
        };
        loadStoredAuth();
    }, []);

    const login = async (credentials: any) => {
        const data = await api.login({ ...credentials, provider: 'email' });
        if (data.status === 'success') {
            setToken(data.token);
            setUser(data.user);
            localStorage.setItem('polla_token', data.token);
            localStorage.setItem('polla_user', JSON.stringify(data.user));
        }
    };

    const loginSocial = async (provider: string, name: string, email: string, avatarUrl: string) => {
        const providerId = 'mock_social_' + Math.random().toString(36).substring(7);
        const data = await api.login({
            provider,
            providerId,
            name,
            email,
            avatarUrl
        });
        if (data.status === 'success') {
            setToken(data.token);
            setUser(data.user);
            localStorage.setItem('polla_token', data.token);
            localStorage.setItem('polla_user', JSON.stringify(data.user));
        }
    };

    const register = async (userData: any) => {
        const data = await api.register(userData);
        // Note: support both 201/200/210 codes
        if (data.status === 'success') {
            setToken(data.token);
            setUser(data.user);
            localStorage.setItem('polla_token', data.token);
            localStorage.setItem('polla_user', JSON.stringify(data.user));
        }
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('polla_token');
        localStorage.removeItem('polla_user');
    };

    const updateUser = (updatedUser: User) => {
        setUser(updatedUser);
        localStorage.setItem('polla_user', JSON.stringify(updatedUser));
    };

    return (
        <AuthContext.Provider value={{ user, token, loading, login, loginSocial, register, logout, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth debe usarse dentro de un AuthProvider');
    }
    return context;
};
