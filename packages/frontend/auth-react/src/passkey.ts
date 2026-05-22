import { startRegistration } from "@simplewebauthn/browser";
import { useCallback, useState } from "react";

type PasskeyRegisterSdk = {
  fetchPasskeyRegisterOptions(): Promise<{ challengeToken: string; options: object }>;
  verifyPasskeyRegister(challengeToken: string, credential: unknown): Promise<void>;
};

export function usePasskeyRegister(sdk: PasskeyRegisterSdk) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const register = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    setIsSuccess(false);
    try {
      const { challengeToken, options } = await sdk.fetchPasskeyRegisterOptions();
      const credential = await startRegistration({ optionsJSON: options as never });
      await sdk.verifyPasskeyRegister(challengeToken, credential);
      setIsSuccess(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [sdk]);

  return { isLoading, error, isSuccess, register };
}
