import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Home,
});

// stub — Task 4 (TDD Green) 에서 useHealthQuery + HealthCard 박음
function Home(): React.ReactElement {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 className="font-semibold text-2xl">service-foundry — web-vite (stub)</h1>
    </main>
  );
}
