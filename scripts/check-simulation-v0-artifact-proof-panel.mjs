#!/usr/bin/env node
import { runSimulationV0UserFacingFeatureScript } from "./lib/simulation-v0-user-facing-feature-runner.mjs";
await runSimulationV0UserFacingFeatureScript(import.meta.url);
