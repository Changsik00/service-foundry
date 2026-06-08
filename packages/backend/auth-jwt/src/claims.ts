/**
 * Access token 커스텀 클레임 이름 — **서명측과 검증측이 반드시 공유**한다.
 *
 * spec-17-08: 과거 서명은 `activeOrgId`, AuthGuard 는 `orgId` 를 읽어 매핑이 끊겼고(클레임 표류)
 * 테넌트 격리가 요청 경로에서 무력화됐다. 문자열을 한 곳에 고정해 재발을 막는다.
 */
export const ACTIVE_ORG_CLAIM = "activeOrgId" as const;
export const ORG_ROLE_CLAIM = "orgRole" as const;
