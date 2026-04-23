import { create } from 'zustand';
import User from '@type/User';
import {
    signup,
    login,
    SignupPayload,
    LoginPayload,
    refreshToken as authRefresh,
    logout as apiLogout,
} from '@/api/auth';
import * as SecureStore from 'expo-secure-store';
import { getMe } from '@/api/users';

const TOKEN_KEY = 'accessToken';
const REFRESH_KEY = 'refreshToken';

export type AuthStatus = 'checking' | 'authenticated' | 'guest';

interface AuthState {
    user: User | null;
    accessToken: string | null;
    refreshToken: string | null;
    status: AuthStatus;
    loading: boolean;
    error: string | null;

    bootstrap: () => Promise<void>;
    signUp: (payload: SignupPayload) => Promise<void>;
    logIn: (payload: LoginPayload) => Promise<void>;
    logOut: () => Promise<void>;
    refreshAccessToken: () => Promise<string>;
    setTokens: (accessToken: string, refreshToken: string) => void;
    clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
    user: null,
    accessToken: null,
    refreshToken: null,
    status: 'checking',
    loading: false,
    error: null,

    bootstrap: async () => {
        set({ loading: true, error: null });
        try {
            const accessToken = await SecureStore.getItemAsync(TOKEN_KEY);
            const refreshToken = await SecureStore.getItemAsync(REFRESH_KEY);

            if (!accessToken) {
                set({ status: 'guest', loading: false });
                return;
            }

            // 임시로 accessToken을 세팅하면 interceptor가 헤더를 붙임
            set({ accessToken, refreshToken });

            // 서버에 검증 요청
            const user = await getMe();

            set({ user, status: 'authenticated', loading: false });
        } catch (err) {
            // 검증 실패하면 로컬 토큰 삭제
            await SecureStore.deleteItemAsync(TOKEN_KEY);
            await SecureStore.deleteItemAsync(REFRESH_KEY);
            set({
                user: null,
                accessToken: null,
                refreshToken: null,
                status: 'guest',
                loading: false,
            });
        }
    },

    signUp: async payload => {
        set({ loading: true, error: null });
        try {
            const res = await signup(payload);
            await SecureStore.setItemAsync(TOKEN_KEY, res.accessToken);
            await SecureStore.setItemAsync(REFRESH_KEY, res.refreshToken);
            set({
                user: res.user,
                accessToken: res.accessToken,
                refreshToken: res.refreshToken,
                status: 'authenticated',
                loading: false,
            });
        } catch (err: unknown) {
            const serverRes = (
                err as { response?: { data?: { message?: string } } }
            ).response;
            const message = serverRes
                ? (serverRes.data?.message ?? '회원가입에 실패했습니다.')
                : '서버와 통신 중 오류가 발생했습니다.';
            set({ error: message, loading: false });
            throw err;
        }
    },

    logIn: async payload => {
        set({ loading: true, error: null });
        try {
            const res = await login(payload);
            await SecureStore.setItemAsync(TOKEN_KEY, res.accessToken);
            await SecureStore.setItemAsync(REFRESH_KEY, res.refreshToken);
            set({
                user: res.user,
                accessToken: res.accessToken,
                refreshToken: res.refreshToken,
                status: 'authenticated',
                loading: false,
            });
        } catch (err: unknown) {
            const serverRes = (
                err as { response?: { data?: { message?: string } } }
            ).response;
            const message = serverRes
                ? (serverRes.data?.message ?? '로그인에 실패했습니다.')
                : '서버와 통신 중 오류가 발생했습니다.';
            set({ error: message, loading: false });
            throw err;
        }
    },

    logOut: async () => {
        // 서버에 refresh token 폐기 요청 (실패해도 진행)
        try {
            const token = get().refreshToken;
            apiLogout(token).catch(() => {});
        } catch {
            // ignore
        }

        // 로컬에서 토큰 삭제 → 그 다음 스토어 초기화
        await SecureStore.deleteItemAsync(TOKEN_KEY);
        await SecureStore.deleteItemAsync(REFRESH_KEY);

        set({
            user: null,
            accessToken: null,
            refreshToken: null,
            status: 'guest',
            error: null,
        });
    },

    refreshAccessToken: async () => {
        const currentRefresh =
            get().refreshToken ?? (await SecureStore.getItemAsync(REFRESH_KEY));
        if (!currentRefresh) throw new Error('No refresh token');

        try {
            const res = await authRefresh(currentRefresh);
            await SecureStore.setItemAsync(TOKEN_KEY, res.accessToken);
            await SecureStore.setItemAsync(REFRESH_KEY, res.refreshToken);
            set({
                accessToken: res.accessToken,
                refreshToken: res.refreshToken,
            });
            return res.accessToken;
        } catch (err) {
            // refresh 실패하면 로그아웃
            await get().logOut();
            throw err;
        }
    },

    setTokens: (accessToken, refreshToken) => {
        set({ accessToken, refreshToken });
    },

    clearError: () => set({ error: null }),
}));
