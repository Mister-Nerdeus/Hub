import type {
  ExportBundleIntegrityContract,
  ReportExportBundleContract
} from "../contracts.js";
import { validateReportExportBundleContract } from "../contracts.js";

export const EXPORT_BUNDLE_INTEGRITY_CREATED_AT = "2026-05-22T00:00:00Z";

export const EXPORT_BUNDLE_INTEGRITY_LIMITATIONS = [
  "Operational-only integrity proof for deterministic local export bundle review.",
  "No tamper-proof claim is made.",
  "No legal/compliance claim is made.",
  "No clinical safety claim is made."
];

export function canonicalizeReportExportBundle(bundle: ReportExportBundleContract): string {
  const validated = validateReportExportBundleContract(bundle);
  return JSON.stringify(canonicalizeValue(validated));
}

export function hashCanonicalJson(canonicalJson: string): string {
  return sha256Hex(utf8Bytes(canonicalJson));
}

export function buildExportBundleIntegrity(
  bundle: ReportExportBundleContract,
  createdAt = EXPORT_BUNDLE_INTEGRITY_CREATED_AT
): ExportBundleIntegrityContract {
  const validated = validateReportExportBundleContract(bundle);
  const canonicalJson = canonicalizeReportExportBundle(validated);
  const integrity: ExportBundleIntegrityContract = {
    schemaVersion: "1.0.0",
    integrityId: `${validated.exportId}-integrity`,
    exportId: validated.exportId,
    createdAt,
    algorithm: "sha256",
    canonicalJsonHash: hashCanonicalJson(canonicalJson),
    canonicalJsonLength: canonicalJson.length,
    limitations: [...EXPORT_BUNDLE_INTEGRITY_LIMITATIONS]
  };

  return validateExportBundleIntegrity(integrity, validated);
}

export function validateExportBundleIntegrity(
  value: unknown,
  bundle?: ReportExportBundleContract
): ExportBundleIntegrityContract {
  const integrity = requireRecord(value, "exportBundleIntegrity");
  requireExactKeys(integrity, "exportBundleIntegrity", [
    "schemaVersion",
    "integrityId",
    "exportId",
    "createdAt",
    "algorithm",
    "canonicalJsonHash",
    "canonicalJsonLength",
    "limitations"
  ]);

  requireLiteral(integrity.schemaVersion, "1.0.0", "schemaVersion");
  requireString(integrity.integrityId, "integrityId");
  const exportId = requireString(integrity.exportId, "exportId");
  requireIsoDateTime(integrity.createdAt, "createdAt");
  requireLiteral(integrity.algorithm, "sha256", "algorithm");
  const canonicalJsonHash = requireString(integrity.canonicalJsonHash, "canonicalJsonHash");
  if (!/^[0-9a-f]{64}$/.test(canonicalJsonHash)) {
    throw new Error("canonicalJsonHash must be lowercase sha256 hex");
  }
  const canonicalJsonLength = requireInteger(
    integrity.canonicalJsonLength,
    "canonicalJsonLength",
    0
  );
  const limitations = requireArray(integrity.limitations, "limitations").map(
    (limitation, index) => validateProofLimitationText(limitation, `limitations[${index}]`)
  );
  validateRequiredIntegrityLimitations(limitations);

  if (bundle != null) {
    const validatedBundle = validateReportExportBundleContract(bundle);
    if (exportId !== validatedBundle.exportId) {
      throw new Error("exportId must match the supplied report export bundle");
    }
    const canonicalJson = canonicalizeReportExportBundle(validatedBundle);
    if (canonicalJsonHash !== hashCanonicalJson(canonicalJson)) {
      throw new Error("canonicalJsonHash must match the supplied report export bundle");
    }
    if (canonicalJsonLength !== canonicalJson.length) {
      throw new Error("canonicalJsonLength must equal canonical JSON string length");
    }
  }

  return {
    ...(integrity as ExportBundleIntegrityContract),
    limitations
  };
}

function canonicalizeValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(canonicalizeValue);
  }
  if (value === null || typeof value !== "object") {
    return value;
  }

  const source = value as Record<string, unknown>;
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(source).sort((left, right) => left.localeCompare(right))) {
    result[key] = canonicalizeValue(source[key]);
  }
  return result;
}

const SHA256_K = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1,
  0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
  0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786,
  0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147,
  0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
  0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b,
  0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a,
  0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
  0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
] as const;

function sha256Hex(input: number[]): string {
  const bytes = [...input];
  const bitLength = bytes.length * 8;
  bytes.push(0x80);
  while ((bytes.length + 8) % 64 !== 0) {
    bytes.push(0);
  }
  const high = Math.floor(bitLength / 0x100000000);
  const low = bitLength >>> 0;
  for (const word of [high, low]) {
    bytes.push((word >>> 24) & 0xff, (word >>> 16) & 0xff, (word >>> 8) & 0xff, word & 0xff);
  }

  let h0 = 0x6a09e667;
  let h1 = 0xbb67ae85;
  let h2 = 0x3c6ef372;
  let h3 = 0xa54ff53a;
  let h4 = 0x510e527f;
  let h5 = 0x9b05688c;
  let h6 = 0x1f83d9ab;
  let h7 = 0x5be0cd19;
  const w = new Array<number>(64).fill(0);

  for (let offset = 0; offset < bytes.length; offset += 64) {
    for (let index = 0; index < 16; index += 1) {
      const start = offset + index * 4;
      w[index] =
        ((bytes[start]! << 24) |
          (bytes[start + 1]! << 16) |
          (bytes[start + 2]! << 8) |
          bytes[start + 3]!) >>>
        0;
    }
    for (let index = 16; index < 64; index += 1) {
      const s0 =
        rotateRight(w[index - 15]!, 7) ^ rotateRight(w[index - 15]!, 18) ^ (w[index - 15]! >>> 3);
      const s1 =
        rotateRight(w[index - 2]!, 17) ^ rotateRight(w[index - 2]!, 19) ^ (w[index - 2]! >>> 10);
      w[index] = (w[index - 16]! + s0 + w[index - 7]! + s1) >>> 0;
    }

    let a = h0;
    let b = h1;
    let c = h2;
    let d = h3;
    let e = h4;
    let f = h5;
    let g = h6;
    let h = h7;

    for (let index = 0; index < 64; index += 1) {
      const s1 = rotateRight(e, 6) ^ rotateRight(e, 11) ^ rotateRight(e, 25);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + s1 + ch + SHA256_K[index]! + w[index]!) >>> 0;
      const s0 = rotateRight(a, 2) ^ rotateRight(a, 13) ^ rotateRight(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (s0 + maj) >>> 0;

      h = g;
      g = f;
      f = e;
      e = (d + temp1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) >>> 0;
    }

    h0 = (h0 + a) >>> 0;
    h1 = (h1 + b) >>> 0;
    h2 = (h2 + c) >>> 0;
    h3 = (h3 + d) >>> 0;
    h4 = (h4 + e) >>> 0;
    h5 = (h5 + f) >>> 0;
    h6 = (h6 + g) >>> 0;
    h7 = (h7 + h) >>> 0;
  }

  return [h0, h1, h2, h3, h4, h5, h6, h7]
    .map((word) => word.toString(16).padStart(8, "0"))
    .join("");
}

function rotateRight(value: number, shift: number): number {
  return (value >>> shift) | (value << (32 - shift));
}

function utf8Bytes(value: string): number[] {
  const bytes: number[] = [];
  for (let index = 0; index < value.length; index += 1) {
    let codePoint = value.charCodeAt(index);
    if (codePoint >= 0xd800 && codePoint <= 0xdbff && index + 1 < value.length) {
      const next = value.charCodeAt(index + 1);
      if (next >= 0xdc00 && next <= 0xdfff) {
        codePoint = 0x10000 + ((codePoint - 0xd800) << 10) + (next - 0xdc00);
        index += 1;
      }
    }

    if (codePoint < 0x80) {
      bytes.push(codePoint);
    } else if (codePoint < 0x800) {
      bytes.push(0xc0 | (codePoint >> 6), 0x80 | (codePoint & 0x3f));
    } else if (codePoint < 0x10000) {
      bytes.push(
        0xe0 | (codePoint >> 12),
        0x80 | ((codePoint >> 6) & 0x3f),
        0x80 | (codePoint & 0x3f)
      );
    } else {
      bytes.push(
        0xf0 | (codePoint >> 18),
        0x80 | ((codePoint >> 12) & 0x3f),
        0x80 | ((codePoint >> 6) & 0x3f),
        0x80 | (codePoint & 0x3f)
      );
    }
  }
  return bytes;
}

function requireRecord(value: unknown, label: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
  return value as Record<string, unknown>;
}

function requireExactKeys(value: Record<string, unknown>, label: string, allowedKeys: string[]): void {
  const allowed = new Set(allowedKeys);
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) {
      throw new Error(`${label}.${key} is not allowed`);
    }
  }
}

function requireArray(value: unknown, label: string): unknown[] {
  if (!Array.isArray(value)) {
    throw new Error(`${label} must be an array`);
  }
  return value;
}

function requireString(value: unknown, label: string): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`${label} must be a non-empty string`);
  }
  return value;
}

function requireInteger(value: unknown, label: string, min?: number): number {
  if (typeof value !== "number" || !Number.isInteger(value)) {
    throw new Error(`${label} must be an integer`);
  }
  if (min !== undefined && value < min) {
    throw new Error(`${label} must be greater than or equal to ${min}`);
  }
  return value;
}

function requireLiteral<T extends string>(value: unknown, expected: T, label: string): T {
  if (value !== expected) {
    throw new Error(`${label} must be ${expected}`);
  }
  return expected;
}

function requireIsoDateTime(value: unknown, label: string): string {
  const stringValue = requireString(value, label);
  if (Number.isNaN(Date.parse(stringValue))) {
    throw new Error(`${label} must be an ISO-compatible timestamp`);
  }
  return stringValue;
}

function validateRequiredIntegrityLimitations(limitations: string[]): void {
  if (limitations.length === 0) {
    throw new Error("limitations requires at least one entry");
  }
  const text = limitations.join(" ").toLowerCase();
  const requiredPhrases: Array<[string, RegExp]> = [
    ["operational-only integrity proof", /\boperational[- ]only\b[\s\S]{0,80}\bintegrity proof\b/],
    ["no tamper-proof claim", /\bno\b[\s\S]{0,40}\btamper[- ]proof\b[\s\S]{0,30}\bclaim\b/],
    [
      "no legal/compliance claim",
      /\bno\b[\s\S]{0,40}\blegal(?:\/| or | )compliance\b[\s\S]{0,30}\bclaim\b/
    ],
    ["no clinical safety claim", /\bno clinical safety claims?\b/]
  ];
  for (const [label, pattern] of requiredPhrases) {
    if (!pattern.test(text)) {
      throw new Error(`limitations must include ${label} language`);
    }
  }
}

function validateProofLimitationText(value: unknown, label: string): string {
  const text = requireString(value, label);
  const lowerText = text.toLowerCase();
  const hasNegatedTamperClaim =
    /\bno\b[\s\S]{0,40}\btamper[- ]proof\b[\s\S]{0,30}\bclaim\b/.test(lowerText);
  const hasNegatedLegalComplianceClaim =
    /\bno\b[\s\S]{0,40}\blegal(?:\/| or | )compliance\b[\s\S]{0,30}\bclaim\b/.test(
      lowerText
    );

  if (/\btamper[- ]proof\b/.test(lowerText) && !hasNegatedTamperClaim) {
    throw new Error(`${label} must not claim tamper-proof integrity`);
  }
  if (
    /\blegal(?:\/| or | )compliance\b/.test(lowerText) &&
    !hasNegatedLegalComplianceClaim
  ) {
    throw new Error(`${label} must not claim legal or compliance status`);
  }

  const forbiddenPhrases = [
    "safe staffing",
    "safe-staffing",
    "clinical adequacy",
    "staffing certification",
    "certifies staffing",
    "safety certification",
    "certifies safety",
    "certified safe",
    "clinically safe",
    "patient outcome",
    "optimized assignment",
    "recommended scenario",
    "recommend this scenario",
    "recommend scenario",
    "best scenario",
    "preferred scenario",
    "optimal scenario",
    "safest scenario",
    "should choose",
    "completed work",
    "walking route accuracy",
    "delay prediction",
    "diagnosis",
    "treatment",
    "clinical note",
    "patient name",
    "ehr",
    "legal audit",
    "audit compliance",
    "chain-of-custody",
    "chain of custody",
    "non-repudiation",
    "non repudiation",
    "digital signature",
    "signed evidence",
    "security certification",
    "security guarantee",
    "legally binding",
    "tamper evident",
    "tamper-evident",
    "encrypted proof"
  ];
  if (forbiddenPhrases.some((phrase) => lowerText.includes(phrase))) {
    throw new Error(`${label} must remain a local deterministic proof only`);
  }
  return text;
}
