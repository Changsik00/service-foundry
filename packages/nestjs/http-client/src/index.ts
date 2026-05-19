import {
  type CreateHttpClientOptions,
  createHttpClient,
  type HttpClient,
} from "@repo/backend-http-client";

export type { CreateHttpClientOptions, HttpClient } from "@repo/backend-http-client";

export const HTTP_CLIENT = Symbol("HTTP_CLIENT");

interface HttpClientDynamicModuleProvider {
  provide: symbol;
  useValue: HttpClient;
}

interface HttpClientDynamicModule {
  module: typeof HttpClientModule;
  providers: HttpClientDynamicModuleProvider[];
  exports: symbol[];
  global: true;
}

export const HttpClientModule = {
  forRoot(options: CreateHttpClientOptions): HttpClientDynamicModule {
    const client = createHttpClient(options);
    return {
      module: HttpClientModule,
      providers: [{ provide: HTTP_CLIENT, useValue: client }],
      exports: [HTTP_CLIENT],
      global: true,
    };
  },
};
