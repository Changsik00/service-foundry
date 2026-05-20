import { HealthCard } from "@repo/frontend-ui";
import { createFileRoute } from "@tanstack/react-router";

import { useHealthQuery } from "@/lib/queries.js";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home(): React.ReactElement {
  const { data, error, isLoading } = useHealthQuery();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 className="font-semibold text-2xl">service-foundry — web-vite</h1>
      <p className="text-muted-foreground text-sm">
        Vite 7 SPA + tanstack-router + tanstack-query (`useHealthQuery` client query)
      </p>
      <HealthCard
        {...(data !== undefined && { data })}
        {...(error !== null && error !== undefined && { error: error.message })}
        loading={isLoading}
      />
    </main>
  );
}
