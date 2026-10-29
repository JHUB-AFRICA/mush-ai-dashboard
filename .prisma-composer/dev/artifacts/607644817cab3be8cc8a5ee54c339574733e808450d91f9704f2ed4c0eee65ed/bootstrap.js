import { readFile } from "node:fs/promises";

const boot = JSON.parse(
  await readFile(new URL("./compute.bootstrap.json", import.meta.url), "utf8"),
);

// Compute currently boots JavaScript with Bun. Its URL and URLSearchParams
// implementations accept Object.defineProperty but reject assignment to
// Node's custom-inspect symbol. SvelteKit assigns that symbol while creating a
// tracked request URL, so install a narrow setter that materializes the same
// own property Node would. Remove this compatibility shim when the upstream
// Alchemy Compute runtime owns the equivalent normalization.
if (process.versions.bun !== undefined) {
  const inspect = Symbol.for("nodejs.util.inspect.custom");
  for (const constructor of [URL, URLSearchParams]) {
    const inherited = constructor.prototype[inspect];
    Object.defineProperty(constructor.prototype, inspect, {
      configurable: true,
      get() { return inherited; },
      set(value) {
        Object.defineProperty(this, inspect, { configurable: true, value, writable: true });
      },
    });
  }
}

const main = (await import(boot.moduleEntrypoint)).default;
await main.run(boot.address, () => import(boot.appEntrypoint));
