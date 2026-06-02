# spec-13-03: data-foundations (번들)

## 📋 메타

| 항목 | 값 |
|---|---|
| **Spec ID** | `spec-13-03` |
| **Phase** | `phase-13` |
| **Branch** | `spec-13-03-data-foundations` |
| **상태** | Planning |
| **타입** | Feature |
| **Integration Test Required** | no |
| **작성일** | 2026-05-31 |
| **소유자** | dennis |

## 📋 배경 및 문제 정의

### 현재 상황
phase-13 잔여 항목(typed client · object storage · seeding/migration) 은 각각 1~2 commit 규모로 작다. 개별 spec 으로 쪼개면 PR/ship 의례 비용이 산출물보다 크다.

### 문제점
- 파일 저장 추상화 부재 — 로컬/클라우드 교체 불가.
- 프론트가 API 응답을 런타임 검증 없이 신뢰 — 계약-실제 drift 무방비.
- 테스트/시드 데이터 생성이 ad-hoc — 표준 factory 없음.

### 해결 방안 (요약)
작고 응집된 3 항목을 **1 spec/PR 로 통합**한다. 복잡/위험한 outbox 는 spec-13-04 로 분리해 리뷰 품질을 지킨다.

## 🎯 요구사항

### Functional Requirements
1. **A `@repo/backend-storage`** (core): `Storage` 포트(`put`/`get`/`del`/`exists`/`url`) + `createMemoryStorage()`. 데이터 `Uint8Array | string`.
2. **B `typedFetch`** (`packages/frontend/http-client`): fetch→JSON→`parser.parse()` 검증 후 타입 반환. parser 는 덕타이핑 `{ parse(v): T }` (zod 직접 의존 없음).
3. **C `@repo/factory`** (shared): `createFactory(builder)` — 시퀀스 증가 + `.build(overrides)` · `.buildList(n, overrides)`.

### Non-Functional Requirements
1. backend-storage / factory 는 framework-agnostic (ADR-0015 core). typedFetch 는 브라우저 안전(node 의존 금지).
2. 기존 frontend http-client export 비파괴.

## 🚫 Out of Scope
- S3/R2 실제 어댑터(AWS SDK) — 포트만 정의, 어댑터는 후속.
- 마이그레이션 통합 러너(라이브 DB 검증 필요) — 후속. factory 가 seeding 의 핵심 primitive.
- outbox → spec-13-04.

## 📑 ADR 후보
- [ ] 없음 (기존 ADR-0015 포트/어댑터 패턴 적용일 뿐)

## 🔗 관련 문서 (Related)
- 관련 ADR: ADR-0015 (core/adapter 경계)
- 관련 spec: [[spec-13-01]] (contracts → typedFetch 사용처), spec-04-02 (frontend http-client)

## ✅ Definition of Done
- [ ] `@repo/backend-storage` put/get/del/exists round-trip 단위 PASS
- [ ] `typedFetch` 정상 파싱 / 검증 실패 throw / init 전달 단위 PASS
- [ ] `@repo/factory` 시퀀스 · overrides · buildList 단위 PASS
- [ ] 전체 typecheck 0
- [ ] `walkthrough.md` 와 `pr_description.md` 작성 및 ship commit
- [ ] `spec-13-03-data-foundations` 브랜치 push 완료
- [ ] 사용자 검토 요청 알림 완료
