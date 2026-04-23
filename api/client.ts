import axios from 'axios';
import Constants from 'expo-constants';

const BASE_URL: string =
    (Constants.expoConfig?.extra?.apiUrl as string | undefined) ??
    'https://bssm-api.zer0base.me';

const apiClient = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request Interceptor
// 모든 요청 전에 실행 — 토큰 주입
apiClient.interceptors.request.use(
    config => {
        // auth-store를 직접 import하면 순환 참조가 생기므로 동적으로 참조
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { useAuthStore } = require('@/store/auth-store');
        const token: string | null = useAuthStore.getState().accessToken;
        if (token) config.headers.Authorization = `Bearer ${token}`;
        return config;
    },
    error => Promise.reject(error),
);

// Response Interceptor
// 모든 응답 후에 실행 — 에러 코드를 한 곳에서 처리
let isRefreshing = false;
let pendingQueue: ((token: string | null) => void)[] = [];

apiClient.interceptors.response.use(
    response => response,
    async error => {
        const status = error.response?.status;

        if (status === 404) {
            console.warn('[API] 리소스를 찾을 수 없습니다:', error.config?.url);
            return Promise.reject(error);
        }

        if (status === 401) {
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            const { useAuthStore } = require('@/store/auth-store');
            const store = useAuthStore.getState();
            const originalConfig = error.config;

            if (!originalConfig) return Promise.reject(error);

            // 이미 retry 한 요청이라면 로그아웃 처리
            if ((originalConfig as any)._retry) {
                // 중복 retry 방지를 위해 로그아웃
                try {
                    await store.logOut();
                } catch {}
                return Promise.reject(error);
            }

            // 갱신이 이미 진행중이면 대기열에 추가
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    pendingQueue.push((token: string | null) => {
                        if (token) {
                            originalConfig.headers.Authorization = `Bearer ${token}`;
                            resolve(apiClient(originalConfig));
                        } else {
                            reject(error);
                        }
                    });
                });
            }

            (originalConfig as any)._retry = true;
            isRefreshing = true;

            try {
                const newAccessToken = await store.refreshAccessToken();
                originalConfig.headers.Authorization = `Bearer ${newAccessToken}`;

                // 대기 중인 요청들 처리
                pendingQueue.forEach(cb => cb(newAccessToken));
                pendingQueue = [];

                return apiClient(originalConfig);
            } catch (refreshError) {
                // 갱신 실패하면 대기열에 null 전달하고 로그아웃
                pendingQueue.forEach(cb => cb(null));
                pendingQueue = [];
                try {
                    await store.logOut();
                } catch {}
                return Promise.reject(error);
            } finally {
                isRefreshing = false;
            }
        }

        console.error('[API] 서버 에러:', status, error.message);
        return Promise.reject(error);
    },
);

export default apiClient;
