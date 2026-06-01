# @repo/nestjs-settings

> `BackendSettingsModule.forRoot(loader)`로 타입 안전 설정 객체를 NestJS DI 컨테이너에 전역 주입.

## 설치 / import
```ts
import { BackendSettingsModule, BACKEND_SETTINGS } from "@repo/nestjs-settings";
```

## 핵심 API
- `BackendSettingsModule.forRoot(loader, env?)` — 설정 로더를 DI 전역 provider로 등록하는 DynamicModule 팩토리
- `BACKEND_SETTINGS` — DI injection token (`@Inject(BACKEND_SETTINGS)`)

## 자세히
- 레퍼런스: [`docs/reference/packages/nestjs-settings.md`](../../../docs/reference/packages/nestjs-settings.md)
- 동작 원리: [`docs/explainers/platform/nestjs-adapter-module-pattern.md`](../../../docs/explainers/platform/nestjs-adapter-module-pattern.md)
