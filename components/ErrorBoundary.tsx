import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface State {
    hasError: boolean;
    error: Error | null;
}

interface Props {
    children: React.ReactNode;
    /** 커스텀 fallback을 주입하면 DefaultFallback 대신 렌더됩니다. */
    fallback?: React.ReactNode;
    /** 에러 발생 시 외부 핸들러 호출 */
    onError?: (error: Error, info: React.ErrorInfo) => void;
}

export class ErrorBoundary extends React.Component<Props, State> {
    state: State = { hasError: false, error: null };

    // 렌더 직전에 호출 — state만 업데이트, 부수 효과 금지
    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    // 렌더 완료 후 호출 — 부수 효과(로깅, 네트워크) 허용
    componentDidCatch(error: Error, info: React.ErrorInfo) {
        console.error('[ErrorBoundary] caught:', error.message);
        console.error('[ErrorBoundary] stack:', info.componentStack);
        this.props.onError?.(error, info);
    }

    private handleReset = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }
            return (
                <DefaultFallback
                    error={this.state.error}
                    onReset={this.handleReset}
                />
            );
        }
        return this.props.children;
    }
}

function DefaultFallback({
    error,
    onReset,
}: {
    error: Error | null;
    onReset: () => void;
}) {
    const errorCode = error?.message?.slice(0, 24) ?? 'UNKNOWN';

    return (
        <View style={styles.container}>
            <Text style={styles.title}>문제가 발생했어요</Text>
            <Text style={styles.description}>
                잠시 후 다시 시도해주세요. 문제가 반복되면 관리자에게
                문의해주세요.
            </Text>
            <Pressable style={styles.button} onPress={onReset}>
                <Text style={styles.buttonText}>다시 시도</Text>
            </Pressable>
            <Text style={styles.code}>에러 코드: {errorCode}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
        gap: 12,
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: '#101828',
    },
    description: {
        fontSize: 14,
        textAlign: 'center',
        color: '#667085',
        lineHeight: 20,
    },
    button: {
        marginTop: 8,
        backgroundColor: '#111827',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 10,
    },
    buttonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    code: {
        marginTop: 4,
        fontSize: 12,
        color: '#98A2B3',
    },
});
