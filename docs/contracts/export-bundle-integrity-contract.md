# Export Bundle Integrity Contract

The export bundle integrity contract gives a locally reviewed report export bundle a deterministic identity fingerprint.

This is an operational-only integrity proof. It is not a tamper-proof security control, legal compliance artifact, digital signature, chain-of-custody record, non-repudiation proof, encryption feature, or clinical safety certification.

## Contract

```ts
type ExportBundleIntegrityContract = {
  schemaVersion: "1.0.0";
  integrityId: string;
  exportId: string;
  createdAt: string;
  algorithm: "sha256";
  canonicalJsonHash: string;
  canonicalJsonLength: number;
  limitations: string[];
};
```

## Determinism

- Canonical JSON sorts object keys recursively.
- Arrays preserve their source order.
- The hash algorithm label is always `sha256`.
- `canonicalJsonHash` is lowercase hexadecimal.
- `canonicalJsonLength` is the canonical JSON string length.
- When a source bundle is supplied, `exportId`, hash, and length must match that bundle.

## Required Limitations

- Operational-only integrity proof.
- No tamper-proof claim.
- No legal/compliance claim.
- No clinical safety claim.

All inputs and fixtures remain synthetic operational data only.
