# feat(spec-13-03): data-foundations 번들 (storage · typed client · factory)

## 📋 Summary
### 배경
phase-13 잔여 소규모 항목 3 개를 개별 spec 대신 **1 PR 로 통합**(의례 비용 절감). 복잡/위험한 outbox 만 spec-13-04 로 분리.

### 주요 변경
- [x] **A `@repo/backend-storage`** (신규, core): `Storage` 포트(`put`/`get`/`del`/`exists`/`url`) + `createMemoryStorage`. S3/R2 는 포트만(후속).
- [x] **B `createApiClient`** (`@repo/frontend-http-client` 확장): 계약 엔드포인트 맵(`{method, path, response}`) → 타입+런타임 검증 메서드 생성. codegen 없는 "타입 추출".
- [x] **C `@repo/factory`** (신규, shared): `createFactory(builder)` 시퀀스/overrides/buildList/reset — 시드·테스트 표준.

### Phase 컨텍스트
- phase-13 성공 기준 **3(typed client)·4(object storage) 충족**, **6(seeding) 부분 충족**(factory; 마이그레이션 러너 후속).

## 🎯 Key Review Points
1. **재검증으로 중복 회피**: 기존 client 가 per-call `schema` 검증 보유 → typedFetch 대신 선언적 엔드포인트 바인딩으로 재조정 (walkthrough §발견).
2. **새 런타임 dep 0**: storage/factory 모두 표준 라이브러리만, createApiClient 는 기존 client 위 얇은 층.
3. core/adapter 경계(ADR-0015): backend-storage·factory framework-agnostic, createApiClient 브라우저 안전.

## 🧪 Verification
```bash
pnpm --filter @repo/backend-storage test      # 7 passed
pnpm --filter @repo/frontend-http-client test  # 13 passed (api-client 4 + 기존 9)
pnpm --filter @repo/factory test               # 5 passed
# typecheck: turbo 전체 PASS (pre-commit 게이트)
```

## 📦 Files Changed
- `packages/backend/storage/**` (신규)
- `packages/shared/factory/**` (신규)
- `packages/frontend/http-client/src/{index.ts,api-client.test.ts}` (createApiClient 추가)
- `specs/spec-13-03-data-foundations/**`, `backlog/phase-13.md`

## ✅ Definition of Done
- [x] 3 패키지 단위 PASS + typecheck 0
- [x] 기존 http-client export 비파괴 (기존 9 테스트 유지)
- [x] walkthrough / pr_description ship

## 🔗 관련
- 후속: spec-13-04 (outbox), S3 어댑터, 마이그레이션 러너, path 파라미터 템플릿
