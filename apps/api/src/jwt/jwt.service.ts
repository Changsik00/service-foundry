import { Injectable, type OnModuleInit } from "@nestjs/common";
import {
  createInMemoryKeyStore,
  type InMemoryKeyStore,
  type Jwks,
  toJwks,
} from "@repo/backend-auth-jwt";

@Injectable()
export class JwtService implements OnModuleInit {
  private keyStore!: InMemoryKeyStore;
  private cachedJwks: Jwks | null = null;

  async onModuleInit(): Promise<void> {
    this.keyStore = await createInMemoryKeyStore();
  }

  async getJwks(): Promise<Jwks> {
    // keyStore 는 onModuleInit 에서 1회 생성되고 rotation 이 없어 JWKS 는 정적 → 캐시.
    // (향후 키 rotation 도입 시 rotate 시점에 `this.cachedJwks = null` 로 무효화 필요.)
    this.cachedJwks ??= await toJwks(this.keyStore);
    return this.cachedJwks;
  }

  getKeyStore(): InMemoryKeyStore {
    return this.keyStore;
  }
}
