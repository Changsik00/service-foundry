# Walkthrough: spec-x-dev-rls-app-runtime

> dev·web-e2e 런타임을 app_runtime role 로 전환 (RLS 활성).

## 📌 결정 기록

| 이슈 | 선택지 | 결정 | 이유 |
|---|---|---|---|
| dev/web-e2e 런타임 role | superuser 유지 / app_runtime 전환 | **app_runtime** | superuser 는 RLS 우회 → 격리 버그를 dev 에서 못 잡음. 운영(k8s)·api e2e 와 일치 |
| CI 배선 | 신규 설계 / verify.yml 미러 | **verify.yml 미러** | 이미 검증된 본보기(role 프로비저닝 + URL 분리) 재사용 |

## 💬 사용자 협의

- **주제**: 다음 작업 추천 → dev RLS 우회 해소 선택
  - **합의**: spec-x 로 진행 (PR e2e CI 가 검증).

## 🧪 검증 결과

- **YAML**: ✅ e2e.yml `yaml.parse` 통과.
- **핵심 검증**: PR 의 e2e CI — app_runtime 런타임으로 web e2e 통과 시 'RLS 활성 + 앱 정상' 동시 입증. (실패 시 RLS 하에서 깨지는 web 흐름을 발견한 것 — 별도 처리)

## 🔍 발견 사항

- api e2e(verify.yml)는 이미 app_runtime + URL 분리로 올바름 → 본보기 재사용.
- env.sample 만 superuser 였고, tooling/docker/env.example 엔 올바른 패턴이 주석으로만 있었음.
- compose initdb 가 app_runtime role 생성 + migration 0012 GRANT → 배선은 env/CI 조정만으로 충분.

## 🚧 이월 항목

- 로컬 dev 기존 `.env` 사용자는 DATABASE_URL 을 app_runtime 로 갱신 필요 (env.sample 반영).
