/**
 * 토큰 확인(이메일 인증 / 비밀번호 재설정) 결과.
 *
 * 서비스는 정확한 outcome 을 반환하고(관측 가능), 컨트롤러(경계)가 enumeration-safe
 * 하게 200 으로 일괄 매핑한다 — ADR-0020 §보안 예외.
 */
export type ConfirmOutcome = "confirmed" | "invalid" | "expired" | "used";
