/**
 * JWT 의 `exp` claim 을 읽어 epoch **ms** 로 반환 (없거나 파싱 실패 시 null).
 *
 * ⚠️ 서명 검증 아님 — 선제 갱신 스케줄링용으로 만료 시각만 읽는다.
 * 토큰 신뢰는 서버 verify 가 담당하므로 여기선 claim 파싱만 한다.
 */
export function decodeJwtExp(token: string): number | null {
  const parts = token.split(".");
  const payloadB64 = parts[1];
  if (parts.length !== 3 || !payloadB64) return null;
  try {
    const json = atob(payloadB64.replace(/-/g, "+").replace(/_/g, "/"));
    const payload = JSON.parse(json) as { exp?: unknown };
    return typeof payload.exp === "number" ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}
