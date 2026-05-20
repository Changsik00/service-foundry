import { type DynamicModule, Module } from "@nestjs/common";
import { type CreateHttpClientOptions, createHttpClient } from "@repo/backend-http-client";

export type { CreateHttpClientOptions, HttpClient } from "@repo/backend-http-client";

export const HTTP_CLIENT = Symbol("HTTP_CLIENT");

@Module({})
export class HttpClientModule {
  static forRoot(options: CreateHttpClientOptions): DynamicModule {
    const client = createHttpClient(options);
    return {
      module: HttpClientModule,
      providers: [{ provide: HTTP_CLIENT, useValue: client }],
      exports: [HTTP_CLIENT],
      global: true,
    };
  }
}
