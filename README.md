# Expo + EAS 실습

이 프로젝트는 EAS 프로젝트 ID `5de38dbd-37c2-4e2d-a65b-1f56da1c6960`에 연결되도록 설정되어 있습니다.

## 실습 1: EAS 환경 변수로 SENTRY_DSN 관리

로컬 `.env`는 다음 키를 사용합니다.

```bash
SENTRY_DSN=...
```

EAS 서버 환경 변수 등록:

```bash
eas env:create --name SENTRY_DSN --value "https://xxx@oxx.ingest.sentry.io/xxxx" --environment production
eas env:create --name SENTRY_DSN --value "https://xxx@oxx.ingest.sentry.io/xxxx" --environment preview
```

앱은 `Constants.expoConfig?.extra?.sentryDsn`으로 DSN을 읽습니다.

## 실습 2: runtimeVersion & updates 설정

`app.config.ts`에 다음이 설정되어 있습니다.

- `runtimeVersion.policy = "appVersion"`
- `updates.url = "https://u.expo.dev/5de38dbd-37c2-4e2d-a65b-1f56da1c6960"`
- `updates.checkAutomatically = "ON_LOAD"`
- `updates.fallbackToCacheTimeout = 0`

## 실습 3: OTA 업데이트 발행 & 롤백

스크립트:

```bash
yarn ota:publish:production
yarn ota:publish:preview
yarn ota:rollback:production
```

직접 명령어로 실행할 때:

```bash
eas update --channel production --environment production --message "hotfix: ..."
eas update:republish --channel production --message "rollback: ..."
```
