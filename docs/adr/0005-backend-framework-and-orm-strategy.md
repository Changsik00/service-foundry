# ADR-005: 백엔드 프레임워크 & ORM 전략 (보류)

* 상태: **보류** — 결정은 백엔드 구현 단계로 연기
* 날짜: 2026-05-17
* 결정 기한: 첫 `packages/backend/*` 패키지 스캐폴딩 이전 (`backlog/phase-03.md`)
* 담당: Platform / Backend
* 스코프: HTTP 프레임워크, ORM/쿼리 계층, 그리고 그 조합에서 따라 나오는 아키텍처 패턴
* 대상 독자: 이 문서는 미래의 사람**과** AI 에이전트가 결정 시점에 빠르고 방어 가능하게 의사결정할 수 있도록 작성된다.

---

# 1. 배경

이것은 보일러플레이트에서 가장 파급력이 큰 미결정 선택이다. 백엔드 프레임워크 선택은 여러 다른 ADR로 연쇄된다:

| 영향받는 후속 영역 | 프레임워크 의존성 |
|---|---|
| 검증 라이브러리 래퍼 | `nestjs-zod` vs `fastify-type-provider-zod` vs `@hono/zod-openapi` |
| 인증 구현 | `@nestjs/passport` vs `better-auth` vs 커스텀 |
| 로거 어댑터 | `nestjs-pino` vs `@fastify/pino` (built-in) vs `hono/logger` |
| OpenAPI 파이프라인 | `@nestjs/swagger` vs `fastify-swagger` vs `@hono/zod-openapi` |
| DI (의존성 주입) | 프레임워크 DI vs 명시적 wiring |
| 테스트 패턴과 CI 속도 | `Test.createTestingModule` vs `fastify.inject` vs Hono Request |
| MSA 진화 | `@nestjs/microservices` vs 커스텀 transport |
| 에러 처리 | `ExceptionFilter` vs `setErrorHandler` vs `onError` |
| 설정 주입 | `ConfigModule.forRoot()` vs Fastify 플러그인 vs context 바인딩 |

이 결정이 5~10개의 후속 ADR을 건드리기 때문에, 성급하게 잠그기보다 **명시적으로 보류**한다. 이 ADR은 결정 시점에 빠르게 실행할 수 있도록 현재까지 알려진 모든 증거를 정리한다.

여러 분석(프로젝트 owner, Claude, 외부 AI 어시스턴트)이 몇 가지 조합으로 수렴했지만 어떤 축이 지배적인지에 대해서는 의견이 갈린다. 그 의견 차이는 여기에 투명하게 기록한다.

---

# 2. 결정

**보류.**

| 항목 | 값 |
|---|---|
| 상태 | 보류 |
| 유력 후보 | **NestJS + Drizzle + PostgreSQL + 얇은 계층 아키텍처 + 통합 테스트 우선 + Zod** |
| 유력 후보에 대한 확신도 | 중간 |
| 최종 결정 트리거 | 첫 `packages/backend/*` 패키지 스캐폴딩 직전 (`backlog/phase-03.md`) |
| 결정 전 필요한 입력 | 유력 조합에 대한 1~2일 spike (§8 참조) |

---

# 3. 미리 잠긴 결정 (결과와 무관하게 고정)

다음은 모든 후보 조합에서 그대로 유지된다:

| 미리 잠긴 결정 | 출처 |
|---|---|
| DB 엔진: **PostgreSQL** | 이 ADR (잠금) |
| 검증: **Zod** | Locked stack memory |
| 테스트 프레임워크: **Vitest** | ADR-002 |
| 로거 코어: **pino** | Locked stack memory |
| 모듈 시스템: ESM only, NodeNext | ADR-002 / ADR-004 |
| TypeScript: strict | ADR-004 |
| 백엔드 패키지 컴파일: **tsup** | ADR-004 |
| 인증 폴더 분리: 3 패키지 (`shared/auth-contracts`, `backend/auth`, `frontend/auth`) | ADR-003 |
| 관측성: OpenTelemetry | Locked stack memory |
| 캐시/큐: Redis (ioredis) + BullMQ | Locked stack memory |
| Edge runtime 예시: `apps/edge-api`의 Hono | Locked stack memory |

아래 결정은 오직 다음만 선택한다: HTTP 프레임워크, ORM, 그리고 따라 나오는 컨벤션 아키텍처 패턴.

---

# 4. 전체 비교 매트릭스

10개의 후보 조합. 출처: 프로젝트 owner의 리서치로, 여러 AI 어시스턴트 분석을 통합 (2026-05-17).

| 조합 | 장점 | 단점 | AI 시대 관점 | 테스트 관점 | 현재 시장/트렌드 | 추천 상황 |
|---|---|---|---|---|---|---|
| **NestJS + Prisma** | 구조 표준화 강함, 온보딩 쉬움, CRUD 생산성 최고급, ecosystem 매우 큼 | abstraction inflation 위험, hidden SQL, Prisma lock-in 느낌, DTO/repository 증식 가능 | AI가 가장 안정적으로 생성하는 조합 중 하나 | unit test 패턴 명확, mock 기반 테스트 쉬움 | 현재 mainstream / 실무 표준급 | 조직 운영, 빠른 개발, 채용/온보딩 중요 |
| **NestJS + Drizzle** | Nest convention + SQL explicitness 조합, PostgreSQL 활용 좋음, 구조 안정성 높음 | Nest boilerplate 존재, Drizzle relation ergonomics 약간 약함 | AI 흔들림 줄이고 explicit SQL 유지 가능 | integration-first 구조 만들기 좋음 | 증가 중인 modern hybrid 흐름 | 장기 유지보수 + 조직화 둘 다 원하는 경우 |
| **Fastify + Prisma** | Fastify 성능 + Prisma DX, 비교적 단순한 구조 가능 | Prisma 한계 그대로 존재, 구조 직접 설계 필요 | explicit runtime + 높은 CRUD 생산성 | 테스트 전략 직접 설계 필요 | startup/backend 실무에서 꽤 현실적 | 빠른 API 개발 + lightweight framework 선호 |
| **Fastify + Drizzle** | explicit, low magic, SQL visibility 최고, PostgreSQL 친화적, infra/control 강함 | 구조를 직접 만들어야 함, 초기 convention 부재 | AI-friendly explicit architecture | integration/e2e 중심 테스트와 궁합 좋음 | modern AI-native/backend trend 상승 중 | platform/backend/core service |
| **Hono + Drizzle** | 초경량, edge 친화적, zod-first, runtime portability 좋음 | enterprise ecosystem 약함, 대규모 운영 사례 적음 | AI가 다루기 쉬운 단순 구조 | contract/e2e 테스트 중심 | 급상승 중 | edge/BFF/serverless |
| **Hono + Prisma** | 빠른 DX, lightweight API 구축 쉬움 | Prisma runtime/engine 특성과 edge 궁합 애매 | AI 생산성 높음 | CRUD 테스트는 쉬움 | niche | 작은 서비스/BFF |
| **NestJS + TypeORM** | 오래된 ecosystem, 자료 많음 | decorator magic 많음, runtime ambiguity, AI가 실수하기 쉬움 | AI 시대엔 점점 불리 | mock-heavy 구조로 가기 쉬움 | 감소 추세 | legacy 유지보수 |
| **NestJS + Sequelize** | 전통적 ORM 패턴 | 타입 안정성 약함, modern TS 흐름과 거리 있음 | AI 생성 품질 편차 큼 | integration 의존 증가 | legacy | 신규 추천 거의 없음 |
| **Fastify + Raw SQL** | 성능/제어 최상, PostgreSQL 100% 활용 가능 | 유지보수 난이도 상승, convention 필요 | AI가 SQL은 잘 짜지만 drift 위험 존재 | integration test 필수 | infra-heavy 팀 일부 사용 | analytics/high-performance |
| **NestJS + Raw SQL** | 조직화 + SQL control | abstraction 혼합 시 복잡성 증가 | AI가 layer 혼합 실수 가능 | 테스트 boundary 명확하면 강함 | 일부 enterprise | complex enterprise backend |

## 4.1 축 요약

| 방향 | 특징 |
|---|---|
| 과거 mainstream | `NestJS + Prisma` |
| 현재 modern trend | `Fastify/Hono + Drizzle` |
| 조직 안정성 중심 | `NestJS` |
| infra/control 중심 | `Drizzle` |
| AI 생산성 최고 | `Prisma` |
| AI 예측 가능성 최고 | `Drizzle` |
| 테스트 convention 강함 | `NestJS` |
| explicit architecture 강함 | `Fastify` |
| PostgreSQL 활용 최강 | `Drizzle + SQL-first` |
| onboarding 쉬움 | `NestJS + Prisma` |
| 장기 runtime visibility | `Drizzle` |
| boilerplate 최소화 | `Hono/Fastify` |

## 4.2 산업 현황 스냅샷 (2026-05)

| 카테고리 | 현재 분위기 |
|---|---|
| 안전한 실무 선택 | `NestJS + Prisma` |
| modern backend engineering | `Fastify + Drizzle` |
| AI-native architecture | `explicit schema + SQL-first` |
| 대규모 조직 운영 | `NestJS` 여전히 강세 |
| infra/platform 팀 선호 | `Drizzle` 빠르게 증가 |
| AI 코드 품질 안정성 | convention 기반 (Nest) 강점 |
| AI runtime 예측 가능성 | explicit 기반 (Drizzle/Fastify) 강점 |

---

# 5. 프로젝트 owner 선호 프로필

미래의 의사결정자(사람 또는 AI)가 동일한 입력으로 추천을 재유도할 수 있도록 기록한다.

## 5.1 owner가 일관되게 중시하는 가치

* **장기 유지보수 가능한 구조** — 주 단위가 아닌 연 단위로 설계
* **AI 시대의 안정성** — 여러 차례의 AI 편집 세션을 거쳐도 drift 없이 살아남는 코드
* **테스트 가능성** — 실제 테스트가 가능한 경계
* **명확한 경계** — 강한 계층/모듈 경계
* **운영 예측 가능성** — 런타임에 동작이 예측 가능함

## 5.2 관찰된 다섯 가지 선호

1. **자유도보다 통제된 생산성 선호** — "정해진 방향 안에서 빠른 것"을 "완전히 자유로운 구조"보다 선호. 플랫폼/팀 지향적 사고.
2. **테스트를 품질 핵심으로 봄** — DI, 서비스 경계, 계층 분리, mocking, integration 구조를 중시. 테스트 이점을 위해서라면 엔터프라이즈 아키텍처 비용을 감수.
3. **과한 abstraction은 싫어함** — 명시성, SQL visibility, PostgreSQL 네이티브 기능, runtime 예측성을 중시. abstraction inflation 없이 테스트 가능한 구조를 원함.
4. **PostgreSQL을 플랫폼으로 봄** — "행을 담는 곳"이 아님. SQL 소유권, 쿼리 가시성, 마이그레이션 제어, 인프라 독립성을 중시. Drizzle과 강하게 align.
5. **AI 시대 관점이 강함** — 반복되는 우려: AI가 실수했을 때 아키텍처가 어떻게 버티는가? 컨벤션 / 경계 / 명시성을 AI 안전 장치로 취급.

## 5.3 이 프로필이 시사하는 것

owner는 "최신 유행" 최적화가 아니다. **"현대화된 엔터프라이즈 아키텍처"** 지향이다:
* 줄일 것: 무거운 OOP, 과도한 abstraction, 숨은 ORM 마법
* 강화할 것: 테스트, 구조, 관측성, 명시성

---

# 6. 유력 후보 추천 근거

**추천 조합:**

```
NestJS
+ Drizzle
+ PostgreSQL
+ Layered Architecture (THIN)
+ Integration-first Testing
+ Zod
```

## 6.1 NestJS가 해결하는 것

| 필요 | NestJS가 다루는 방식 |
|---|---|
| 컨벤션 | AI가 파일 레이아웃, 네이밍, 의존 방향을 발명할 필요가 없음 |
| 테스트 구조 | 모듈 / provider / DI / 격리 패턴이 정형화되어 있음 |
| 조직화 | 플랫폼 사고에 맞는 온보딩, 일관성, 확장성 |

## 6.2 Drizzle이 해결하는 것

| 필요 | Drizzle이 다루는 방식 |
|---|---|
| SQL 소유권 | ORM이 DB를 숨기지 않음 |
| 런타임 예측성 | 생성되는 SQL이 보이고, 추적 가능하며, 튜닝 가능 |
| PostgreSQL 활용 | JSONB, CTE, 인덱싱, 쿼리 최적화가 일급 시민으로 유지 |
| Zod 시너지 | `drizzle-zod`가 DB 스키마로부터 계약을 생성 → 단일 진실 공급원 |

## 6.3 결정적 제약 — 계층을 얇게(THIN) 유지하라

| 허용되는 계층화 | 금지되는 계층화 (AI-explosion 위험) |
|---|---|
| 컨트롤러 → 서비스 → 리포지토리(선택) → DB | 컨트롤러 → 서비스 → UseCase → 리포지토리 → Adapter → Mapper → Factory → Entity → DTO |

owner가 중시하는 것은 *경계*이지 *계층 그 자체*가 아니다. 경계가 부하를 지게 될 때에 한해서만 계층을 추가한다.

## 6.4 테스트 전략

**통합 테스트 우선 + 핵심 도메인 유닛 테스트**

근거: AI 보조 개발에서는 mock 위주 테스트가 testcontainers Postgres 기반 통합 테스트보다 실제 버그를 덜 잡는다. 유닛 테스트는 순수 로직 도메인 규칙에 한정한다.

## 6.5 현실적 포지셔닝

| 측면 | 판정 |
|---|---|
| AI 안전성 | 높음 |
| 장기 유지보수성 | 강함 |
| 온보딩 | 양호 |
| 테스트 규율 | 달성 가능 |
| PostgreSQL 제어 | 보존됨 |
| 위험: 초기 boilerplate | 존재 |
| 위험: Nest abstraction | 중간 수준으로 여전히 존재 |
| 위험: 계층 inflation | 규율로만 완화 가능 |
| 위험: CRUD DX | Prisma만큼 빠르지는 않음 |

---

# 7. 능동적 비판 — 이 추천을 무너뜨릴 수 있는 요인

적대적 섹션. 이 추천은 결정 시점에 아래 비판들에 답할 수 있어야만 살아남는다.

## C1. NestJS + Drizzle은 커뮤니티 전용 통합

**공식 `@nestjs/drizzle` 모듈이 없다.** 실제 패턴:

* `@knaadh/nestjs-drizzle-postgres` — 커뮤니티 래퍼, 스타 수 낮음
* 커스텀 provider를 사용한 DIY `DrizzleModule` (가장 흔함; 패턴당 ~20~40줄)
* `@nestjs/config` 또는 우리의 `@repo/backend/settings`에서 connection string 전달

**시사점:** 보일러플레이트가 `DrizzleModule` 소스를 직접 소유 — 허용 가능하지만 유지보수 부담 추가.

**완화책:** 캐노니컬 패턴을 구현하는 참조용 `@repo/backend/database-drizzle`을 포함. 보일러플레이트의 부가가치로 취급.

## C2. NestJS + Vitest는 알려진 셋업 마찰이 있음 (ADR-002로 Vitest 잠금)

NestJS는 기본적으로 Jest를 쓴다. 우리의 locked stack은 Vitest다. 동작하는 조합은 다음을 요구한다:

* 데코레이터 메타데이터 변환을 위한 `unplugin-swc`
* 특정 `vite.config.ts` 설정 (예: `isolate: false`)
* `reflect-metadata` import 순서 규율
* `vmThreads`에서의 mock resolution 엣지 케이스

**시사점:** 치명적이지 않다. `@repo/vitest-config`에 NestJS 전용 preset이 필요하다. 테스트 부팅 시간은 Fastify 대비 느림 (파일당 ~5~10배).

**완화책:** 파일 내에서 테스트들 사이에 `INestApplication`을 재사용. `@repo/vitest-config/node-nestjs`에 golden Vitest preset 정의.

## C3. 매트릭스의 "modern trend" 표현은 편집자적 해석

정량적 현실 (2026-05):

* NestJS: ~70k GitHub stars, npm 다운로드 점유율 거대, 대기업 채택 지배적
* Fastify: ~33k stars, 꾸준한 성장
* Hono: ~22k stars, 가장 빠른 상승

트렌드 ≠ 지배력. NestJS는 **production-mainstream**. Fastify+Drizzle은 더 작은 설치 기반을 가진 **modern-mainstream**. Hono는 **edge-mainstream**.

**시사점:** 차단 요인 없음 — NestJS와 Fastify 모두 안전한 선택. 프레이밍의 정직성을 위해 명시.

## C4. "얇은 계층 아키텍처"는 현재 정의가 부족함

추천은 "컨트롤러 → 서비스 → 리포지토리(선택) → DB"라고 말한다. 열린 질문들:

* 도메인 모델은 어디에 사는가? `service/` 안의 plain class? 별도 `domain/` 폴더?
* 횡단 검증은 어디서 일어나는가? Pipe? Interceptor? 서비스?
* 비즈니스 불변식은 어디에 사는가? 서비스? 도메인 객체?
* `Repository(선택)`에는 무엇이 들어가는가? 순수 Drizzle 쿼리? 도메인 타입 메서드?

**시사점:** 구체적 답이 없으면 AI 에이전트가 세션마다 다른 답을 고를 것 — NestJS를 선택한 동기인 "컨벤션" 이점이 무너진다.

**완화책:** 이 ADR의 최종 결정과 짝지어 **별도의 `docs/conventions/backend-module-layout.md`** 를 프레임워크 선택 직후 작성. 이 문서는 Phase 3 수락의 차단 요소다.

## C5. 통합 테스트 우선은 실제 CI 비용이 있음

| 측면 | 유닛 우선 | 통합 우선 |
|---|---|---|
| CI wall time | 빠름 | 3~10배 느림 |
| 셋업 오버헤드 | 낮음 | testcontainers + 픽스처 |
| 버그 검출 능력 | 제한적 | 높음 |
| 실패 격리 | 쉬움 | 종종 불명확 |
| TDD inner loop 속도 | 빠름 | 느림 |

**시사점:** AI-first 목표에는 합당하나 TDD inner loop가 손해를 본다. 계층화된 정책이 필요하다:

| 트리거 | 실행되는 테스트 |
|---|---|
| 파일 저장 (watch) | affected 유닛 테스트만 |
| Pre-commit (lefthook) | affected 유닛 테스트 + lint |
| Pre-push (lefthook) | affected 통합 테스트 |
| CI | 전체 suite |

## C6. Drizzle + Zod 시너지는 매트릭스에 없는 조용한 승리

`drizzle-zod`는 Drizzle 테이블로부터 Zod 스키마를 생성한다. 우리의 locked Zod-first 계약과 결합:

```
Drizzle schema  →  drizzle-zod  →  @repo/shared/contracts  →  frontend
```

DB에서 UI까지 단일 진실 공급원. **이것은 프레임워크와 무관하게 Drizzle에 대한 독립적인 한 표다.**

---

# 8. 결정 기준 프레임워크 (최종 결정용)

각 후보 조합을 다음 기준에 대해 점수화한다. 가중치는 이 프로젝트가 명시한 우선순위를 반영한다. 가중 총점이 가장 높은 것이 승리한다.

| 기준 | 가중치 (1~5) | 측정 대상 |
|---|---|---|
| AI 친화적 명시적 wiring | 4 | AI 에이전트가 메타데이터 오류 없이 일반적인 모듈을 재생성할 수 있는가? |
| 컨벤션 강제 | 4 | 프레임워크가 세션 간 구조적 drift를 막는가? |
| 테스트 피드백 속도 (TDD loop) | 4 | 변경된 파일에 대한 `vitest watch` 왕복 시간 |
| PostgreSQL / SQL 소유권 | 4 | SQL을 보고 수정할 수 있는가? 인덱스 튜닝? JSONB 사용? |
| 온보딩 비용 | 3 | 새 개발자 / AI 에이전트가 유용한 PR을 만들기까지의 시간 |
| 장기 유지보수성 | 5 | 3년 뒤에도 건강한 선택인가? |
| 운영 예측 가능성 | 5 | 런타임에 성능 / 쿼리 / 에러를 예측할 수 있는가? |
| 커뮤니티 / 학습 데이터 깊이 | 3 | 인기 스택일수록 AI가 더 일관된 코드를 작성 |
| 벤더 중립성 | 3 | 비즈니스 로직을 다시 쓰지 않고 나중에 ORM / 프레임워크를 교체할 수 있는가? |
| CRUD 개발 속도 | 2 | 새 엔드포인트에 full CRUD를 추가하는 시간 |
| Edge / serverless 이식성 | 1 | Cloudflare / Vercel Edge에서 실행 가능한가? (`apps/edge-api`로 커버됨) |

---

# 9. Spike 계획 (확정 전 1~2일)

다음 수락 기준으로 유력 조합을 프로토타입한다:

| 단계 | 산출물 | 시간 |
|---|---|---|
| `apps/api-spike`를 Fastify adapter 위의 NestJS, ESM, Vitest로 생성 | 앱이 부팅되고 hello 반환 | 2h |
| `users` 테이블 하나, Drizzle migrate, drizzle-zod 스키마를 가진 `packages/backend/database-drizzle-spike` 추가 | 마이그레이션 실행, 스키마 import 가능 | 3h |
| @nestjs/passport (JWT) + Drizzle 쿼리로 POST `/auth/login` 구현 | curl 로그인이 JWT 반환 | 4h |
| Vitest: 서비스에 대한 유닛 테스트, testcontainers postgres와의 통합 테스트 | 둘 다 green | 3h |
| 측정: cold start, watch 왕복, 테스트 wall time, 빌드 시간 | spike 리포트에 수치 기록 | 2h |
| spike 리포트 작성 → 아래 §11에 추가 | Pass / fail 결정 | 1h |

## 9.1 게이트 기준

| 지표 | 통과 임계값 |
|---|---|
| Watch 왕복 (변경된 서비스 파일) | ≤ 3s |
| Cold app boot | ≤ 2s |
| CI에서 50개 통합 테스트 suite | ≤ 30s |
| `drizzle-zod` 스키마를 `@repo/shared/contracts`와 공유 | 수동 cast 없이 동작 |
| `reflect-metadata` 순서 함정 | 관찰되지 않음 |

게이트 중 하나라도 실패하면 **Fastify + Drizzle + better-auth** (매트릭스 기준 차선)로 폴백한다.

---

# 10. 각 후보의 아키텍처적 시사점

각 조합이 후속 ADR에 무엇을 잠그는지:

| 조합 | 인증 | 검증 | 로거 | OpenAPI | 에러 |
|---|---|---|---|---|---|
| NestJS + Drizzle | `@nestjs/passport` + `@nestjs/jwt` | `nestjs-zod` + `ValidationPipe` | `nestjs-pino` | `@nestjs/swagger` + `nestjs-zod` | `ExceptionFilter` |
| NestJS + Prisma | 위와 동일 | 동일 | 동일 | 동일 | 동일 |
| Fastify + Drizzle | `better-auth` 또는 `@fastify/jwt` | `fastify-type-provider-zod` | `@fastify/pino` (built-in) | `@fastify/swagger` + `zod-to-openapi` | `setErrorHandler` |
| Fastify + Prisma | 동일 | 동일 | 동일 | 동일 | 동일 |
| Hono + Drizzle | `better-auth` | `@hono/zod-validator` + `@hono/zod-openapi` | `hono/logger` | `@hono/zod-openapi` (best in class) | `onError` |

**순서적 시사점:** ADR-005가 결정되기 전까지 후속 ADR(인증 / 검증 / 로거 / openapi / 에러)은 분기 없이는 작성할 수 없다. 그 ADR들은 ADR-005가 결정된 **이후에** 작성된다.

---

# 11. Spike 결과

_Spike (§9) 실행 시점에 채워질 예정._

```
Date:
Combination tested:
Watch round-trip:
Cold boot:
50-test integration suite wall time:
Drizzle + zod schema sharing works:
Vitest setup notes:
Decision: GO / NO-GO
Fallback chosen if NO-GO:
```

---

# 12. 재검토 기준 (최종 결정 이후)

다음 경우 이 ADR을 다시 연다:

* AI 보조 개발 워크플로가 선택된 프레임워크에서 1개월간 2배 이상 높은 에러율을 보임
* Vitest + 선택된 프레임워크가 upstream에 문서화되지 않은 hack을 요구함
* Drizzle이 우리의 DIY 패턴을 대체하는 공식 NestJS 모듈을 릴리즈 (유지보수 부담에 영향)
* 두 번째 백엔드 서비스(`apps/api-2`)를 추가해야 하는데 선택된 스택의 확장이 나쁨
* 새 프레임워크 / 런타임이 프로덕션 패리티에 도달 (유력 후보: Bun + ElysiaJS, Encore)

---

# 13. 결정 시점에 풀어야 할 열린 질문

| 질문 | 왜 중요한가 |
|---|---|
| NestJS 하에서 Express adapter vs Fastify adapter | 성능과 미들웨어 ecosystem에 영향 |
| `apps/api` 단일 배포 vs 이미 분리된 모듈 | Pre-MSA 준비 |
| Drizzle 마이그레이션: Drizzle Kit vs 커스텀 스크립트 | 마이그레이션 UX |
| `@repo/backend/database-drizzle`은 어디서 끝나고 `apps/api` 스키마는 어디서 시작하는가? | 스키마 소유권 경계 |
| 통합 테스트 오케스트레이션: testcontainers vs docker-compose 스냅샷 | CI 복잡도 vs 재현성 |

---

# 14. 관련 문서

* [ADR-001](./0001-linting-formatting-strategy.md) — AI-first 철학
* [ADR-002](./0002-monorepo-foundations.md) — Node 22, pnpm, Vitest, lefthook 잠금
* [ADR-003](./0003-package-layout-and-naming.md) — 3-패키지 인증 분리 잠금
* [ADR-004](./0004-typescript-and-compilation-strategy.md) — 컴파일 백엔드 (tsup) 잠금
* `docs/turborepo-rules.md` — 빌드/테스트 파이프라인 패턴
* 향후: `docs/conventions/backend-module-layout.md` — 프레임워크 선택 후 필수 (C4 완화)
