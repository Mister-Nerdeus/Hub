import { createDeveloperEvidenceViewModel } from "../developerEvidenceViewModel";

const operator = createDeveloperEvidenceViewModel("operator");
const serialized = JSON.stringify(operator);
if (/docs\/verification|docs\/manual-review|packages\/shared|[a-f0-9]{64}/u.test(serialized)) {
  throw new Error("operator mode must not contain raw paths or hashes");
}
