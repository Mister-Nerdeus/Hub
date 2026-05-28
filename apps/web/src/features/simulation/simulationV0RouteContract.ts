import type { SimulationV0ReviewState } from "./simulationV0ReviewState";

export type SimulationV0ControlsRegion = {
  landmarkId: "simulation-v0-controls";
  profileSelectorVisible: true;
  ratioControlsVisible: true;
};

export type SimulationV0OutputRegion = {
  landmarkId: "simulation-v0-output";
  timelineVisible: boolean;
  summaryCardsVisible: boolean;
};

export type SimulationV0ProofRegion = {
  landmarkId: "simulation-v0-proof";
  occupiedBedProofVisible: boolean;
  artifactHashProofVisible: boolean;
  artifactExportAvailable: boolean;
};

export type SimulationV0RouteViewModel = {
  status: "internal_synthetic_dry_run_only";
  title: string;
  subtitle: string;
  reviewState: SimulationV0ReviewState;
  controlsRegion: SimulationV0ControlsRegion;
  outputRegion: SimulationV0OutputRegion;
  proofRegion: SimulationV0ProofRegion;
  limitationCopy: string[];
  forbiddenClaims: {
    optimizer: false;
    assignmentRecommendation: false;
    clinicalSafety: false;
    staffingCompliance: false;
    patientOutcome: false;
  };
};
