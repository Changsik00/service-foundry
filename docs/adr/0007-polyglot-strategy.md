# ADR-007: Polyglot 전략

* 상태: **채택됨**
* 날짜: 2026-05-17
* 스코프: service-foundry가 다중 언어 서비스(현재 TS, 향후 Python, 가능하면 그 외)를 어떻게 다루는가
* 담당: Platform

---

# 1. 배경

저장소를 `node-monorepo` → **`service-foundry`** 로 개명한 것은, 향후 워크로드(특히 RAG / ML inference / scientific compute)가 Node/TS 서비스와 함께 Python을 요구할 가능성이 높다는 점을 인정한 것이다.

제약:

* 현재 스코프는 Node/TS 전용 (`backlog/phase-01.md` ~ `backlog/phase-06.md`)
* Python 서비스는 *예상되나 아직 명세되지 않음* (6–12개월 시계)
* TS 생태계는 HTTP 서비스, 타입 공유 contract, AI/에이전트 툴링, 개발자 경험 측면에서 현재 가장 강한 선택지다
* Python은 RAG, vector DB 클라이언트, 모델 inference, ML notebook 영역에서 여전히 지배적이다
* Turborepo + pnpm + catalogs 투자(ADR-001 ~ ADR-004)는 Node 전용이며 상당한 규모다 — 첫날부터 polyglot으로 가기 위해 이를 버리는 것은 실질적인 비용이 든다

본 ADR이 해결하는 질문: **"지금은 Node-first 설계"를 유지하면서 "나중에 Python"이 어색해지지 않게 하려면 어떻게 해야 하는가?**

---

# 2. 결정

```txt
Now (Phase 1–6):
  Pure Node/TS monorepo with pnpm + Turborepo.
  No Python. No polyglot orchestrator.

When Python arrives:
  Isolated `python/` sibling subtree with its own workspace
  (uv or poetry), its own test runner, its own boundary tooling.
  NOT mixed into pnpm/turborepo.
  Cross-language orchestration via root `justfile` (or Makefile).

Cross-language communication:
  HTTP (or gRPC) only. No shared types.
  Python services publish OpenAPI; TS generates clients via codegen.
```

TS는 서버 사이드의 **주(主)** 언어로 유지된다. Python은 Python이 진정 지배적인 워크로드에 한정해 사용한다.

---

# 3. Python이 들어올 때의 구조 룰

```
service-foundry/
├─ apps/                    # Node/TS apps
├─ packages/                # Node/TS packages (with category grouping per ADR-003)
├─ python/                  # NEW root for Python world (when added)
│  ├─ apps/                 # Python services (rag, ml-inference, ...)
│  ├─ packages/             # Python libs (if needed)
│  ├─ pyproject.toml        # uv/poetry workspace root
│  └─ uv.lock               # or poetry.lock
├─ tooling/
│  └─ docker/               # shared infra docker-compose
├─ justfile                 # cross-language commands (build:all, test:all, ...)
├─ turbo.json               # Node side only
├─ pnpm-workspace.yaml      # Node side only
└─ package.json
```

### 강제 룰

* Python 파일은 **절대** `apps/*`이나 `packages/*` 안에 두지 않는다 (이들은 pnpm workspace glob이다)
* `python/` 서브트리는 pnpm 및 Turborepo에 보이지 않는다
* 각 Python 서비스는 자체 Dockerfile과 CI lane을 가진다
* symlink 없음, 언어 간 모노레포 전역 캐시 공유 없음
* `justfile`은 운영자 친화적인 언어 간 명령을 제공하지만 빌드 오케스트레이터가 되려고 하지는 않는다

### Justfile 스케치 (Python 도입 시)

```just
# Build everything
build-all:
    pnpm turbo run build
    cd python && uv build --all

# Test everything
test-all:
    pnpm turbo run test
    cd python && uv run pytest

# Lint everything
lint-all:
    pnpm turbo run lint
    cd python && uv run ruff check
```

---

# 4. 언어 간 통신

| Concern | Approach |
|---|---|
| API contract | OpenAPI (Python 서비스가 발행하고 TS는 codegen으로 소비 — 기존 backend → frontend SDK 흐름과 동일 패턴) |
| Transport | HTTP 우선, 성능이나 streaming이 요구될 때만 gRPC |
| Auth | TS API 게이트웨이가 JWT 발급, Python 서비스가 동일 JWT 검증 (settings의 공유 secret) |
| Observability | 두 언어 모두 동일 collector로 OTel export |
| Errors | 각 서비스는 JSON으로 말하고, 소비자는 자체 에러 레이어로 매핑 |
| Types | **공유 타입 없음.** TS 관점에서는 Python 서비스를 third-party HTTP API처럼 다룬다. |

---

# 5. 명시적으로 거부하는 것

| Rejected approach | Why |
|---|---|
| **moonrepo**를 첫날부터 polyglot 오케스트레이터로 | 좋은 도구지만 Turborepo digest + pnpm catalogs 작업을 버려야 함. 이득(통합 캐시)은 Python 서비스가 5개 이상 되기 전까지 나타나지 않음 |
| **bazel** | 이 규모에서는 과잉; 작성 비용이 큼 |
| **nx** | 어차피 Node-centric; Python 지원은 얕은 플러그인 수준 |
| **`apps/*` 또는 `packages/*`에 Python 섞기** | pnpm workspace 전제를 깨고 Turborepo task graph를 오염시킴 |
| **언어 간 타입 공유** (Pydantic ↔ Zod via codegen) | 가능은 함(datamodel-code-generator 등). 그러나 이 규모에서는 결합 비용 > 이득; OpenAPI를 contract로 쓰자 |
| **ADR 없이 모든 Python 계획 연기** | 저장소 개명 자체가 polyglot 의도를 광고하므로, 방법을 문서화하지 않으면 모순이 남는다 |

---

# 6. 결과

## 장점

* 오늘의 Node-first 설계가 가설적 미래 때문에 타협하지 않는다
* Python 서비스는 도입될 때 깔끔한 격리된 관심사로 들어온다
* 각 언어가 관용적 툴링을 사용한다 (Node는 pnpm + Turborepo; Python은 uv + ruff + pytest)
* "최소 공통 분모" 오케스트레이터가 없다
* CI 병렬성이 자연스럽다 (Node lane + Python lane이 독립적으로 실행)

## 단점

* 단일한 언어 간 캐시 키가 없다 (Python 재빌드는 Node 변경을, Node는 Python을 모른다)
* 유지할 CI lane이 둘이다
* `justfile`이라는 오케스트레이션 레이어가 하나 더 생긴다
* Python 서비스가 3개 배포를 넘고 언어 간 의존성이 잦아지면 격리가 부담이 될 수 있다 — 이때 moonrepo 마이그레이션이 매력적이 된다 (§8 참조)

---

# 7. 검토한 대안

| Alternative | Rejected because |
|---|---|
| moonrepo from day 1 | 검증되지 않은 미래 이득을 위해 Node-first ergonomics를 희생함 |
| bazel | 과잉; 수천 명 규모 팀의 도구 |
| nx with Python plugins | 플러그인이 얕고 Turborepo를 잃음 |
| Python을 서브폴더로 둔 단일 pnpm workspace | 동작하지 않음 — pnpm은 JS 패키지 레이아웃을 전제함 |
| 모든 Python 계획을 조용히 연기 | "service-foundry"로의 개명이 이미 의도를 함의함; 향후 기여자가 모순을 읽게 됨 |
| Python을 Node 패키지 안에 스크립트로 임베드 | 유지보수 + 툴링 악몽 |

---

# 8. 재검토 트리거

다음 경우 본 ADR을 다시 연다:

* Python 서비스가 **3개의 구별되는 배포**를 넘고, 잦은 언어 간 의존성 변화가 발생할 때
* **언어 간 schema-of-truth**가 시급해질 때 (그럴 가능성은 낮음 — OpenAPI가 대부분을 처리함)
* moonrepo 또는 동등 도구가 성숙한 TS + Python 지원을 갖춘 사실상의 polyglot 표준이 될 때
* 새로운 언어(Go, Rust)가 스코프에 들어오고, 3+ 언어 트리에서 격리 패턴이 부담을 보일 때
* CI 총 wall time이 언어 간 캐시 인지 부재로 인해 지배될 때

---

# 9. 열린 질문 (Python이 실제 도입될 때 해결)

| Question | When |
|---|---|
| Python workspace에서 uv vs poetry | 첫 Python 서비스 시작 시 |
| Python 패키지 간 공유할 ruff 설정 preset | 동일 |
| Python OpenTelemetry exporter 배선 | 첫 Python 서비스 |
| Python 서비스가 secret / config를 어떻게 소비할지 | 첫 Python 서비스 (env vars로 node-settings 패턴을 모사?) |
| `@repo/<lang>-shared/openapi` contract registry를 유지할지 | 두 번째 Python 서비스 또는 두 번째 TS↔Python 통합이 들어올 때 |
| 언어 간 Docker base image 전략 | 첫 Python 서비스 |

---

# 10. 관련 문서

* [ADR-001](./0001-linting-formatting-strategy.md) — Lint/format (Node 측, Biome)
* [ADR-002](./0002-monorepo-foundations.md) — Node/pnpm/Turborepo 고정 (Node 측 전용)
* [ADR-003](./0003-package-layout-and-naming.md) — `apps/*`와 `packages/*/*`는 Node 전용 glob
* [backlog/queue.md](../../backlog/queue.md) — Python 작업은 아직 어떤 Phase에도 없음; 본 ADR이 유일한 참조
