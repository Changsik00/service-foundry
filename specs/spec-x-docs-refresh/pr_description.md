# docs(spec-x-docs-refresh): README/문서 최신화 + 완료 spec/phase 아카이브

> 첫 줄은 commit subject 와 정확히 일치해야 합니다 (`type(spec-...): description`).

## 📋 Summary

### 배경 및 목적
phase-17~26 을 거치며 멀티테넌시·RBAC·데이터 UX·어드민+빌링·k8s 배포·public_id 체계가 추가됐지만 루트 `README.md`는 이를 반영하지 못했고("앱 4개" vs 실제 3개 내부 모순 포함), `docs/index.md` 패키지 reference 목록엔 4개 패키지가 누락돼 있었다. 또한 `specs/`·`backlog/`에 완료된 spec 30개 + spec-x 9개 + phase backlog 5개가 archive 되지 않고 쌓여 있었다.

### 주요 변경 사항
- [x] README "앱 4개"→"앱 3개" 정정 + 패키지 카테고리 개수 실측치 반영(backend 22→26, nestjs 6→9, frontend 7→8) + "핵심 역량" 절에 멀티테넌시/RBAC/데이터 UX/어드민+빌링/k8s/public_id 추가
- [x] `docs/index.md` 누락 패키지 4개(`backend-id`/`backend-schema`/`backend-tenant`/`nestjs-tenant`) reference 인덱스 항목 추가 + 카테고리 개수 정정
- [x] `sdd archive` 실행 — spec 30개 + spec-x 9개 + phase-23~26 backlog 5개 → `archive/`

### Phase 컨텍스트
- **Phase**: 없음 (spec-x — 코드 변경 없는 자기완결 docs/chore)
- **본 SPEC 의 역할**: 문서 SoT를 실제 코드베이스 상태와 재동기화하고, 완료된 SDD 산출물을 아카이브해 `specs/`/`backlog/` 작업 표면을 정리한다.

## 🎯 Key Review Points

1. **README 핵심 역량 문구**: phase-17~26 산출물을 한 줄에 압축 요약했다 — 과장/누락 없는지 확인 필요.
2. **docs/index.md 신규 4항목의 위키링크**: `docs/reference/packages/{backend-id,backend-schema,backend-tenant,nestjs-tenant}.md`는 아직 존재하지 않는 forward reference(Icebox에 상세 페이지 작성 항목으로 유지) — 의도된 것으로, dangling link 아님을 인지 요망.
3. **아카이브는 `sdd archive` 자체 커밋**(`dd72d96`)으로 이미 별도 처리됨 — 이 PR엔 rename-only diff로 포함.

## 🧪 Verification

### 자동 테스트
```bash
bash .harness-kit/bin/sdd status
```

**결과 요약**:
- ✅ 문서 전용 spec — 코드 테스트 대상 없음(§9.1 예외)
- ✅ archive 관련 진단 문구 소거 확인

### 수동 검증 시나리오
1. **README 읽기**: 앱/패키지 개수 표기가 서로 모순되지 않음 → 전부 "3개"/실측치로 일치
2. **`grep -c "backend-tenant\|backend-schema\|backend-id\|nestjs-tenant" docs/index.md`**: 4 → 누락 항목 전부 추가됨

## 📦 Files Changed

### 🛠 Modified Files
- `README.md` (+12, -6): 앱/패키지 수치 정정 + 핵심 역량 갱신
- `docs/index.md` (+8, -2): 누락 패키지 reference 4개 추가 + 개수 정정
- `backlog/queue.md`: spec-x 대기 마커 갱신 (sdd 자동)

### 📦 Renamed (archive, 별도 자동 커밋 `dd72d96`)
- `specs/*` 30개 spec + 9개 spec-x → `archive/specs/*`
- `backlog/phase-{23,24,25,26}.md` → `archive/backlog/*`

**Total**: 137 files changed (README/docs/index.md/queue.md 실 콘텐츠 변경 3건 + 나머지는 rename-only)

## ✅ Definition of Done

- [x] 문서 전용 — 코드 테스트 대상 없음(§9.1 예외)
- [x] `walkthrough.md` ship commit 완료
- [x] `pr_description.md` ship commit 완료
- [x] lint / type check 대상 없음 (docs-only)
- [x] 사용자 검토 요청 알림 완료

## 🔗 관련 자료

- Walkthrough: `specs/spec-x-docs-refresh/walkthrough.md`
- 관련 Icebox 항목: `backlog/queue.md` — 패키지 reference 상세 페이지, ci-verify-gate explainer, turbo generator drift
