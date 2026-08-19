import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <section className="max-w-2xl text-center">
        <p className="mb-3 text-sm font-medium uppercase tracking-[0.3em] text-neutral-500">
          Portfolio
        </p>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl">
          El comienzo de algo nuevo.
        </h1>
        <p className="mt-6 text-lg leading-8 text-neutral-600 dark:text-neutral-400">
          La base técnica está lista. El siguiente paso es convertirla en un
          portafolio que represente tu trabajo.
        </p>
        <Button className="mt-8">Comenzar a construir</Button>
      </section>
    </main>
  );
}
