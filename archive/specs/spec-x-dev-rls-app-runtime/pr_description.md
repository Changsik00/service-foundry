# fix(spec-x-dev-rls-app-runtime): run dev/web-e2e under app_runtime role (RLS active)

## 📋 Summary

### 배경 및 목적
RLS 테넌트 격리(spec-17-07)는 비-슈퍼유저 `app_runtime` role 로 접속할 때만 적용된다. 그러나 로컬 dev(`env.sample`)와 web e2e(`e2e.yml`)는 `postgres` superuser 로 런타임 접속 → **RLS 통째 비활성** → 격리 버그를 개발 중 못 잡고, 운영(k8s)·api e2e 와 환경 불일치. api e2e(`verify.yml`)는 이미 올바르므로 그 패턴을 dev·web e2e 에 맞춘다.

### 주요 변경 사항
- [x] `env.sample`: dev `DATABASE_URL` → app_runtime, `DATABASE_MIGRATE_URL`(superuser) 추가
- [x] `e2e.yml`: app_runtime role 프로비저닝 + migrate(superuser)/runtime(app_runtime) URL 분리 (verify.yml 미러)
- [x] `org.spec.ts`: stale 주석 갱신 (RLS 적용됨)

## 🎯 Key Review Points

1. **런타임/마이그레이션 role 분리**: 런타임=app_runtime(RLS), 마이그레이션=postgres(owner, DDL+GRANT).
2. **회귀 위험**: web e2e 가 app_runtime 로 돌 때 자기 org 시나리오가 여전히 통과해야 함. 통과 = "RLS 활성 + 앱 정상" 동시 입증. **실패 시** RLS 하에서 깨지는 web 흐름을 발견한 것(실제 격리 갭) → 후속 처리.
3. compose initdb 의 app_runtime role + migration 0012 GRANT 가 전제 (이미 존재).

## 🧪 Verification

- YAML 파싱 통과 (e2e.yml).
- **핵심 검증 = 본 PR 의 e2e CI**: app_runtime 런타임으로 web e2e 통과 확인.

## 📦 Files Changed
- `env.sample`: dev 런타임 app_runtime + MIGRATE_URL
- `.github/workflows/e2e.yml`: role 프로비저닝 + URL 분리
- `apps/web/e2e/org.spec.ts`: RLS 주석 갱신

## ✅ Definition of Done
- [x] env.sample / e2e.yml / org.spec.ts 수정
- [x] e2e.yml YAML 유효
- [ ] PR e2e CI 그린 (app_runtime 하에서 web e2e 통과)
