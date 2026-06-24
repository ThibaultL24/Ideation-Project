// scripts/verify-catalog-slice.ts
import "dotenv/config";
import { fetchCatalogGraphSlice } from "../src/lib/intuition/catalog-graph";

async function main() {
  const slice = await fetchCatalogGraphSlice("mainnet");

  console.log("=== Mainnet catalog slice ===\n");
  console.log(`Graph subjects: ${slice?.subjects.length ?? 0}`);
  console.log(`Predicate: ${slice?.predicateId ?? "n/a"}`);
  console.log(`Object: ${slice?.objectId ?? "n/a"}`);
  console.log(`OK: ${(slice?.subjects.length ?? 0) >= 362}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
