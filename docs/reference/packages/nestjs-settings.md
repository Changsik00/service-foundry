---
type: reference
aliases: ["@repo/nestjs-settings", "NestJS 설정 모듈"]
tags: [service-foundry, reference, nestjs, config]
---

# @repo/nestjs-settings — `backend-settings` NestJS DI 어댑터

> 💡 **한 줄 요약**: `BackendSettingsModule.forRoot(loader)` 로 타입 안전 설정 객체를 NestJS DI 컨테이너에 전역 주입.
> **위치**: `packages/nestjs/settings` · **상위**: [[architecture]]

## 책임 (Responsibility)

`@repo/backend-settings`의 `defineSettings` loader 를 NestJS `DynamicModule` 패턴으로 감싼다. 부트 시점에 `process.env`(또는 주입된 env)로 loader를 실행하고, 결과를 `BACKEND_SETTINGS` symbol provider로 전역 노출한다. ADR-0016 표준 `@Module` class 패턴을 따른다.

## 공개 API / export

| export | 종류 | 설명 |
|---|---|---|
| `BACKEND_SETTINGS` | symbol | DI injection token |
| `BackendSettingsModule` | class (`@Module`) | `forRoot(loader, env?)` static DynamicModule 팩토리 |

## 의존

- 내부: `@repo/backend-settings` (re-export 없이 내부 사용)
- 외부: `@nestjs/common`, `reflect-metadata`

## 사용 예

```ts
import { defineSettings } from "@repo/backend-settings";
import { BackendSettingsModule, BACKEND_SETTINGS } from "@repo/nestjs-settings";

const loadSettings = defineSettings({ PORT: { type: "number", default: 3000 } });

@Module({ imports: [BackendSettingsModule.forRoot(loadSettings)] })
export class AppModule {}

@Injectable()
class SomeService {
  constructor(@Inject(BACKEND_SETTINGS) private settings: AppSettings) {}
}
```

## 연결된 개념

- [[adr/0015-framework-adapter-naming-and-layout]] — 어댑터 네이밍 규약
- [[adr/0016-nestjs-adapter-standard-module-pattern]] — 표준 Module 패턴
- [[explainers/platform/nestjs-adapter-module-pattern]] — 동작 원리
- [[explainers/platform/config-packages-presets]] — 설정 레이어 구조

> 소스: spec-03-01 · `packages/nestjs/settings/src/index.ts`
