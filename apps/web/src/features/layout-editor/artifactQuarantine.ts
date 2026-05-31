import type { RenderedObjectRegistryEntry } from "./renderedObjectRegistry";
import { RENDERED_OBJECT_REGISTRY } from "./renderedObjectRegistry";

export type UnknownVisualArtifact = {
  renderId: string;
  selector?: string;
  visibleInNormalEditorMode: boolean;
};

export type QuarantinedReferenceArtifact = UnknownVisualArtifact & {
  layer: "reference_overlay";
  sourceKind: "reference";
  selectable: true;
  editable: false;
  removable: false;
  reasonLocked: string;
};

export type ArtifactQuarantineResult = {
  renderableGeometry: readonly RenderedObjectRegistryEntry[];
  quarantinedReferenceOverlays: readonly QuarantinedReferenceArtifact[];
  removedFromNormalRendering: readonly UnknownVisualArtifact[];
};

export const artifactQuarantinePolicy = {
  normalRendering: "registry_only",
  unknownVisuals: "quarantine_as_reference_overlay",
  validGeometry: "preserve"
} as const;

export function quarantineUnknownVisuals(
  visuals: readonly UnknownVisualArtifact[],
  registry: readonly RenderedObjectRegistryEntry[] = RENDERED_OBJECT_REGISTRY
): ArtifactQuarantineResult {
  const registryIds = new Set(registry.map((entry) => entry.renderId));
  const registrySelectors = new Set(registry.map((entry) => entry.selector));
  const quarantinedReferenceOverlays: QuarantinedReferenceArtifact[] = [];
  const removedFromNormalRendering: UnknownVisualArtifact[] = [];

  for (const visual of visuals) {
    if (registryIds.has(visual.renderId) || (visual.selector != null && registrySelectors.has(visual.selector))) {
      continue;
    }
    if (!visual.visibleInNormalEditorMode) {
      removedFromNormalRendering.push(visual);
      continue;
    }
    quarantinedReferenceOverlays.push({
      ...visual,
      layer: "reference_overlay",
      sourceKind: "reference",
      selectable: true,
      editable: false,
      removable: false,
      reasonLocked: "Unknown visual is quarantined as locked reference overlay evidence."
    });
  }

  return {
    renderableGeometry: registry,
    quarantinedReferenceOverlays,
    removedFromNormalRendering
  };
}
