/**
 * @repo/nestjs-settings — `@repo/backend-settings`의 NestJS DI 어댑터.
 *
 * pure settings (framework-agnostic) 를 NestJS DynamicModule 로 wrap.
 * 호출자는 `BackendSettingsModule.forRoot(loader)` 로 부트.
 *
 * ADR-0016: 표준 `@Module` class 패턴 채택.
 */
import { type DynamicModule, Module } from "@nestjs/common";

/**
 * NestJS DI injection token. 호출자는 `@Inject(BACKEND_SETTINGS)`로
 * 주입된 typed settings 객체에 접근한다.
 */
export const BACKEND_SETTINGS = Symbol("BACKEND_SETTINGS");

/**
 * Loader 호출 결과를 NestJS DI 컨테이너에 *전역 provider*로 박는 thin adapter.
 *
 * 라이브러리(`@env-kit/node-settings`)의 `defineSettings`로 만든 loader를
 * 받고, 부트 시점의 env(기본 `process.env`)로 호출해 *frozen typed settings*를
 * `BACKEND_SETTINGS` symbol provider로 노출.
 *
 * @example
 * ```ts
 * import { defineSettings } from "@repo/backend-settings";
 * import { BackendSettingsModule, BACKEND_SETTINGS } from "@repo/nestjs-settings";
 *
 * const loadSettings = defineSettings({ ... });
 *
 * @Module({
 *   imports: [BackendSettingsModule.forRoot(loadSettings)],
 * })
 * export class AppModule {}
 *
 * @Injectable()
 * export class SomeService {
 *   constructor(@Inject(BACKEND_SETTINGS) private readonly settings: AppSettings) {}
 * }
 * ```
 */
@Module({})
export class BackendSettingsModule {
  static forRoot<TSettings>(
    loader: (env: Record<string, string | undefined>) => TSettings,
    env: Record<string, string | undefined> = process.env,
  ): DynamicModule {
    const settings = loader(env);
    return {
      module: BackendSettingsModule,
      providers: [{ provide: BACKEND_SETTINGS, useValue: settings }],
      exports: [BACKEND_SETTINGS],
      global: true,
    };
  }
}
