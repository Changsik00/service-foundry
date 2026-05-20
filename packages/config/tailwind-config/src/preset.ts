/**
 * @repo/tailwind-config — preset entry (currently empty).
 *
 * tailwind v4 의 CSS-first 패러다임에서 theme tokens 는 `globals.css` 의 `@theme` directive 안에
 * 박힘. JS preset 의 의미는 v3 대비 줄어듬 (content paths / plugins 정도).
 *
 * 호출자가 `@import "@repo/tailwind-config/globals.css"` 만 박으면 대부분 OK.
 * 추후 plugin / content path 공유 필요 시 본 파일 채움.
 */

export const preset = {
  /**
   * tailwind v4 에서 content paths 는 자동 감지 (vite/postcss plugin) — 명시 불필요.
   * 다만 monorepo 의 *workspace dep* 컨텐츠 스캔 위해 호출자가 명시 가능.
   */
  content: [] as string[],
};

export default preset;
