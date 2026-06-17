// pnpm install hook.
//
// @env-kit/node-settings 는 next/vite 를 *optional* peerDependency 로 선언한다(프레임워크
// 어댑터용). 그러나 본 보일러플레이트는 백엔드(packages/backend|nestjs/settings)에서
// core defineSettings 만 쓰고 next/vite 어댑터는 쓰지 않는다.
//
// 같은 워크스페이스의 apps/web 이 next 를 갖고 있어, pnpm 이 node-settings 인스턴스를
// "next peer 충족" 변형으로 해석 → backend-settings 경유 apps/api 컨테이너 이미지까지
// next(~288MB)가 끌려온다 (spec-22-02 발견). optional peer 를 제거해 이 누출을 끊는다.
// apps/web 의 next 자체는 직접 의존이라 영향 없음.
function readPackage(pkg) {
  if (pkg.name === "@env-kit/node-settings") {
    for (const key of ["peerDependencies", "peerDependenciesMeta"]) {
      if (pkg[key]) {
        delete pkg[key].next;
        delete pkg[key].vite;
      }
    }
  }
  return pkg;
}

module.exports = { hooks: { readPackage } };
