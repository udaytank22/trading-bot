import React, { createContext, ReactNode, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    apiPost,
    clearAuthToken,
    saveAuthToken,
} from '../apiHelper';
import { showToast } from '../../components/common/CustomToast';
import { API_ENDPOINTS } from '../apiService';

interface AuthProviderProps {
    children: ReactNode; // Accepts React children
}

interface UserInfo {
    api_token: string;
    name: string | null;
    profile_pic: string;
    email: string | null;
    mobile_no: string;
    status: number;
}

interface AuthContextType {
    login: (mobileNo: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    isLoading: boolean;
    setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
    userToken: string | null;
    userInfo: UserInfo | null;
    setUserToken: React.Dispatch<React.SetStateAction<string | null>>;
    setUserInfo: React.Dispatch<React.SetStateAction<UserInfo | null>>;
    loginError: string;
}

export const AuthContext = createContext<AuthContextType | null>(null);
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [userToken, setUserToken] = useState<string | null>(null);
    const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
    const [loginError, setLoginError] = useState<string>('');

    const login = async (mobileNo: string, password: string): Promise<void> => {
        setIsLoading(true);
        try {
            const payload = {
                email: mobileNo,
                password,
            };
            console.log('payload', payload);
            const response = await apiPost(API_ENDPOINTS.AUTH.LOGIN, payload);

            if (response.success) {
                const userInfo = response.data;

                await AsyncStorage.setItem('userInfo', JSON.stringify(userInfo));
                await saveAuthToken(userInfo.api_token);
                setUserInfo(userInfo); // Assuming `setUserInfo` is in scope
                setUserToken(userInfo.api_token);
            } else {
                setLoginError(response.message); // Assuming `setLoginError` is in scope
                // showToast('error', response.message);
            }
        } catch (error: unknown) {
            setLoginError('Invaild username or password');
            if (error instanceof Error) showToast('error', error.message);
        } finally {
            setIsLoading(false); // Ensure loading stops only for old users
        }
    };

    const isLoggedIn = async (): Promise<void> => {
        try {
            setIsLoading(true);
            let userToken = await AsyncStorage.getItem('authToken');
            const userInfoString = await AsyncStorage.getItem('userInfo');

            if (userInfoString) {
                const userInfo: UserInfo = JSON.parse(userInfoString);
                setUserToken(userToken);
                setUserInfo(userInfo);
            }

            setIsLoading(false);
        } catch (e) {
            console.log('is logged in error', e);
            setIsLoading(false);
        }
    };

    const logout = async (): Promise<void> => {
        setUserToken(null);
        setUserInfo(null);
        await clearAuthToken();
        await AsyncStorage.removeItem('userInfo');
        setIsLoading(false);
        setLoginError('');
    };

    useEffect(() => {
        isLoggedIn();
    }, []);

    const contextValue = React.useMemo(
        () => ({
            login,
            logout,
            isLoading,
            userToken,
            userInfo,
            setUserToken,
            setUserInfo,
            loginError,
            setIsLoading,
        }),
        [
            login,
            logout,
            isLoading,
            userToken,
            userInfo,
            setUserToken,
            setUserInfo,
            loginError,
            setIsLoading,
        ],
    );

    return (
        <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
    );
};