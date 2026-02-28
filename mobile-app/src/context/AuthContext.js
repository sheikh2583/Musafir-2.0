import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../services/authService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        const userData = await authService.getCurrentUser();
        setUser(userData);
        setIsAuthenticated(true);
      }
    } catch (error) {
      await AsyncStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const data = await authService.login(email, password);
      await AsyncStorage.setItem('token', data.token);
      setUser({
        _id: data._id,
        name: data.name,
        email: data.email,
        phoneNumber: data.phoneNumber,
      });
      setIsAuthenticated(true);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data };
    }
  };

  const register = async (name, email, password, phoneNumber) => {
    try {
      const data = await authService.register(name, email, password, phoneNumber);
      if (data.token) {
        await AsyncStorage.setItem('token', data.token);
        setUser({
          _id: data._id,
          name: data.name,
          email: data.email,
          phoneNumber: data.phoneNumber,
        });
        setIsAuthenticated(true);
        return { success: true };
      } else {
        throw new Error('No token received from server');
      }
    } catch (error) {
      console.log('Register error:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Registration failed';
      return { success: false, error: { message: errorMsg } };
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem('token');
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
