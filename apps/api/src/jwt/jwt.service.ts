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

  async onModuleInit(): Promise<void> {
    this.keyStore = await createInMemoryKeyStore();
  }

  async getJwks(): Promise<Jwks> {
    return toJwks(this.keyStore);
  }

  getKeyStore(): InMemoryKeyStore {
    return this.keyStore;
  }
}
