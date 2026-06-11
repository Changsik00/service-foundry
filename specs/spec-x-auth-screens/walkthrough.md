# Walkthrough: spec-x-auth-screens

## 📌 결정 기록

| 이슈 | 선택지 | 결정 | 이유 |
|---|---|---|---|
| 테넌트 선택·초대 화면 | 포함 / 제외 | **제외 → spec-x-org-screens 후속** | supabase 모드 api 는 `GET /auth/me` 만 마운트 — org 표면(switch/invite/members + "내 조직 목록") 백엔드 선행 필요 (조사 근거 spec.md) |
| 소셜 로그인 버튼 | DESIGN §6.1 포함 / 생략 | **생략 (fill-forward)** | OAuth provider 미구성 — 비활성 버튼은 filler |
| 비밀번호 재설정 링크 | stub 링크 / 생략 | **생략** | 404 가는 죽은 링크는 stub 이 아니라 결함 — reset flow spec 에서 링크와 함께 |
| Task 1·2 커밋 | 분리 / 병합 | **병합 1 commit** | 공유 스키마·(auth) 골격으로 단일 응집 변경 |
| jsdom email 검증 | — | **form noValidate** | 네이티브 constraint validation 이 submit 차단 → Zod 인라인 에러 불가시화. 검증은 Zod 단일화 |
| signUp 세션 부재 | 무시 / SDK 수정 | **SDK 정공법 수정** | 이메일 확인 활성 프로젝트에서 `data.session!` 크래시 → `unverified_email` 반환. normalize rate limit 대소문자 불문 |
| Supabase Confirm email | ON 유지 / OFF | **dev OFF (사용자 토글)** | ON 이면 e2e 비결정 + 메일 rate limit. **prod ON 복원 필수** — env.sample + SignupForm 주석으로 명문화 (사용자 요청) |
| FormMessage | 유지 | **role="alert" + text-error-text** | 기존 e2e 의 alert 셀렉터 + DESIGN §2.4 (destructive #d44c47 는 텍스트 AA 미달 → #b3261e) |

## 🧪 검증 결과

```
단위: features/auth 11/11 + auth-supabase 21/21 (TDD Red→Green 기록)
e2e:  10/10 PASS (기존 7 + 골격 렌더 + 회원가입 콘솔 직행 + GuestOnly 가드)
게이트: turbo lint/typecheck/build/test GREEN · knip 0 · depcruise ✔
```

## ✅ DESIGN §8 Audit Checklist 자가검증

1. 회색 감사 — 임의 회색 hex 없음 (semantic 유틸만) ✅
2. 블루 감사 — brand 는 CTA·링크만, Primary 화면당 1개 ✅
3. 경계 감사 — Input shadow-ring, 카드 shadow-md (CSS border 0) ✅
4. 라디우스 감사 — 카드 12(rounded-lg)/인풋·버튼 8(rounded-md), pill 없음 ✅
5. 숫자·한글 감사 — keep-all 전역(base), auth 화면 수치 컬럼 없음 ✅
6. 톤 감사 — 이모지·감탄사·환영문구 0, 에러 = 사실+행동(+예시) ✅
7. a11y 감사 — 라벨 항상 표시(FormLabel htmlFor), role=alert, focus-visible 전역, 중복 aria 없음 ✅

## 📦 Commits

1. feat: features/auth 구조 + 로그인·회원가입 화면 (19 files)
2. fix: supabase signup 세션 부재·rate limit 정규화 (SDK)
3. test: guestonly 가드 + 회원가입·골격 e2e
4. docs: ship walkthrough and pr description
