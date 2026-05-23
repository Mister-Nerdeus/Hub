export const requiredEvidenceGates = [
  {
    label: "Issue 024 Phase 2 evidence",
    paths: [
      "docs/verification/phase-2-plan-builder-evidence.md",
      "docs/verification/phase-2-plan-builder-checklist.md",
      "docs/verification/issues/issue-024/screenshots/recreated-er-pod-plan.png",
      "docs/verification/issues/issue-024/screenshots/reload-proof.png",
      "docs/verification/issues/issue-024/sample-json/exported-er-pod-plan.json",
      "docs/verification/issues/issue-024/validation-output.txt"
    ]
  },
  {
    label: "Issue 038 Phase 3 evidence",
    paths: [
      "docs/verification/phase-3-manual-assignment-evidence.md",
      "docs/verification/phase-3-manual-assignment-checklist.md",
      "docs/verification/issues/issue-038/scoring-output.json",
      "docs/verification/issues/issue-038/warning-output.json",
      "docs/verification/issues/issue-038/screenshots/manual-assignment-proof.png",
      "docs/verification/issues/issue-038/commands.txt",
      "docs/verification/issues/issue-038/closeout.md"
    ],
    contentChecks: [
      {
        path: "docs/verification/phase-3-manual-assignment-evidence.md",
        checks: [
          ["Manual assignment", /\bmanual assignment\b/i],
          ["Room burden", /\broom burden\b/i],
          ["Nurse burden", /\bnurse burden\b/i],
          ["Warning output", /\bwarning output\b/i],
          ["No PHI", /\bno\s+phi\b/i],
          ["No full-shift simulation", /\bno\b[\s\S]{0,80}\bfull-shift simulation\b/i],
          ["No optimizer", /\bno\b[\s\S]{0,80}\boptimizer\b/i]
        ]
      },
      {
        path: "docs/verification/phase-3-manual-assignment-checklist.md",
        checks: [
          ["contracts", /\bcontracts?\b/i],
          ["room-load", /\broom-load\b|\broom load\b/i],
          ["room scoring", /\broom scoring\b|\broom workload scoring\b/i],
          ["assignment warnings", /\bassignment warnings\b|\bmanual assignment warnings\b/i],
          ["nurse scoring", /\bnurse scoring\b|\bnurse burden scoring\b/i],
          ["web proof", /\bweb proof\b|\bweb view\b|\bweb screenshot\b/i],
          ["local verifier", /\blocal verifier\b|\blocal verification\b/i]
        ]
      }
    ]
  },
  {
    label: "Issue 047 Phase 4 evidence",
    paths: [
      "docs/verification/phase-4-task-generation-evidence.md",
      "docs/verification/phase-4-task-generation-checklist.md",
      "docs/verification/issues/issue-047/generated-tasks-output.json",
      "docs/verification/issues/issue-047/random-output.json",
      "docs/verification/issues/issue-047/validation-output.txt",
      "docs/verification/issues/issue-047/commands.txt",
      "docs/verification/issues/issue-047/closeout.md"
    ],
    contentChecks: [
      {
        path: "docs/verification/phase-4-task-generation-evidence.md",
        checks: [
          ["Assumptions register", /\bassumptions register\b/i],
          ["Task templates", /\btask templates\b/i],
          ["Day profiles", /\bday profiles\b/i],
          ["Shift scenario", /\bshift scenario\b/i],
          ["Seeded randomness", /\bseeded randomness\b/i],
          ["Generated operational tasks", /\bgenerated operational tasks\b/i],
          ["No PHI", /\bno\s+phi\b/i],
          ["No full-shift simulation", /\bno\b[\s\S]{0,80}\bfull-shift simulation\b/i],
          ["No optimizer", /\bno\b[\s\S]{0,80}\boptimizer\b/i]
        ]
      },
      {
        path: "docs/verification/phase-4-task-generation-checklist.md",
        checks: [
          ["assumptions", /\bassumptions register\b/i],
          ["templates", /\btask templates\b/i],
          ["day profiles", /\bday profiles\b/i],
          ["shift scenario", /\bshift scenario\b/i],
          ["seeded randomness", /\bseeded randomness\b/i],
          ["generated tasks", /\bgenerated operational tasks\b/i],
          ["local verifier", /\blocal verifier\b|\blocal verification\b/i]
        ]
      }
    ]
  },
  {
    label: "Issue 053 Phase 5 evidence",
    paths: [
      "docs/verification/phase-5-task-assignment-evidence.md",
      "docs/verification/phase-5-task-assignment-checklist.md",
      "docs/verification/issues/issue-053/parity-output.json",
      "docs/verification/issues/issue-053/timeline-output.json",
      "docs/verification/issues/issue-053/assignment-output.json",
      "docs/verification/issues/issue-053/validation-output.txt",
      "docs/verification/issues/issue-053/commands.txt",
      "docs/verification/issues/issue-053/closeout.md"
    ],
    contentChecks: [
      {
        path: "docs/verification/phase-5-task-assignment-evidence.md",
        checks: [
          ["Assumptions-driven scoring", /\bassumptions-driven scoring\b/i],
          ["Generated task validation", /\bgenerated task validation\b/i],
          ["Task timeline aggregation", /\btask timeline aggregation\b/i],
          ["Nurse task assignment contract", /\bnurse task assignment contract\b/i],
          ["Manual room coverage assignment", /\bmanual room coverage assignment\b/i],
          ["No optimizer", /\bno\b[\s\S]{0,80}\boptimizer\b/i],
          ["No task completion simulation", /\bno\b[\s\S]{0,80}\btask completion simulation\b/i],
          ["No walking route calculation", /\bno\b[\s\S]{0,80}\bwalking route calculation\b/i],
          ["No PHI", /\bno\s+phi\b/i]
        ]
      },
      {
        path: "docs/verification/phase-5-task-assignment-checklist.md",
        checks: [
          ["Assumptions-driven scoring", /\bassumptions-driven scoring\b/i],
          ["Generated task validation", /\bgenerated task validation\b/i],
          ["Task timeline aggregation", /\btask timeline aggregation\b/i],
          ["Nurse task assignment contract", /\bnurse task assignment contract\b/i],
          ["Manual room coverage assignment", /\bmanual room coverage assignment\b/i],
          ["No optimizer", /\bno\b[\s\S]{0,80}\boptimizer\b/i],
          ["No task completion simulation", /\bno\b[\s\S]{0,80}\btask completion simulation\b/i],
          ["No walking route calculation", /\bno\b[\s\S]{0,80}\bwalking route calculation\b/i],
          ["No PHI", /\bno\s+phi\b/i]
        ]
      }
    ]
  },
  {
    label: "Issue 058 Phase 6 evidence",
    paths: [
      "docs/verification/phase-6-reporting-evidence.md",
      "docs/verification/phase-6-reporting-checklist.md",
      "docs/verification/issues/issue-058/report-output.json",
      "docs/verification/issues/issue-058/screenshots/report-proof.png",
      "docs/verification/issues/issue-058/validation-output.txt",
      "docs/verification/issues/issue-058/commands.txt",
      "docs/verification/issues/issue-058/closeout.md"
    ],
    contentChecks: [
      {
        path: "docs/verification/phase-6-reporting-evidence.md",
        checks: [
          ["Operational report contract", /\boperational report contract\b/i],
          ["Operational summary report", /\boperational summary report\b/i],
          ["Nurse workload report", /\bnurse workload report\b/i],
          ["Unassigned task report", /\bunassigned task report\b/i],
          ["Warning report", /\bwarning report\b/i],
          ["API-free web proof", /\bapi-free web proof\b/i],
          ["No optimizer", /\bno\b[\s\S]{0,80}\boptimizer\b/i],
          ["No task completion simulation", /\bno\b[\s\S]{0,80}\btask completion simulation\b/i],
          ["No walking route calculation", /\bno\b[\s\S]{0,80}\bwalking route calculation\b/i],
          ["No delay calculation", /\bno\b[\s\S]{0,80}\bdelay calculation\b/i],
          ["No clinical safety claims", /\bno\b[\s\S]{0,80}\bclinical safety claims\b/i],
          ["No PHI", /\bno\s+phi\b/i]
        ]
      },
      {
        path: "docs/verification/phase-6-reporting-checklist.md",
        checks: [
          ["Operational report contract", /\boperational report contract\b/i],
          ["Operational summary report", /\boperational summary report\b/i],
          ["Nurse workload report", /\bnurse workload report\b/i],
          ["Unassigned task report", /\bunassigned task report\b/i],
          ["Warning report", /\bwarning report\b/i],
          ["API-free web proof", /\bapi-free web proof\b/i],
          ["No optimizer", /\bno\b[\s\S]{0,80}\boptimizer\b/i],
          ["No task completion simulation", /\bno\b[\s\S]{0,80}\btask completion simulation\b/i],
          ["No walking route calculation", /\bno\b[\s\S]{0,80}\bwalking route calculation\b/i],
          ["No delay calculation", /\bno\b[\s\S]{0,80}\bdelay calculation\b/i],
          ["No clinical safety claims", /\bno\b[\s\S]{0,80}\bclinical safety claims\b/i],
          ["No PHI", /\bno\s+phi\b/i]
        ]
      }
    ]
  },
  {
    label: "Issue 063 Phase 7 evidence",
    paths: [
      "docs/verification/phase-7-comparison-export-evidence.md",
      "docs/verification/phase-7-comparison-export-checklist.md",
      "docs/verification/issues/issue-063/comparison-output.json",
      "docs/verification/issues/issue-063/export-bundle-output.json",
      "docs/verification/issues/issue-063/screenshots/comparison-proof.png",
      "docs/verification/issues/issue-063/validation-output.txt",
      "docs/verification/issues/issue-063/commands.txt",
      "docs/verification/issues/issue-063/closeout.md"
    ],
    contentChecks: [
      {
        path: "docs/verification/phase-7-comparison-export-evidence.md",
        checks: [
          ["Scenario comparison contract", /\bscenario comparison contract\b/i],
          ["Manual scenario comparison", /\bmanual scenario comparison\b/i],
          ["Report export JSON bundle", /\breport export JSON bundle\b/i],
          ["Report export JSON bundle builder", /\breport export JSON bundle builder\b/i],
          ["API-free comparison proof", /\bapi-free comparison proof\b/i],
          ["No optimizer", /\bno\b[\s\S]{0,80}\boptimizer\b/i],
          ["No recommendation", /\bno\b[\s\S]{0,80}\brecommendation\b/i],
          ["No clinical safety claims", /\bno\b[\s\S]{0,80}\bclinical safety claims\b/i],
          ["No API endpoints", /\bno\b[\s\S]{0,80}\bapi endpoints\b/i],
          ["No persistence", /\bno\b[\s\S]{0,80}\bpersistence\b/i],
          ["No PHI", /\bno\s+phi\b/i]
        ]
      },
      {
        path: "docs/verification/phase-7-comparison-export-checklist.md",
        checks: [
          ["Scenario comparison contract", /\bscenario comparison contract\b/i],
          ["Manual scenario comparison", /\bmanual scenario comparison\b/i],
          ["Report export JSON bundle", /\breport export JSON bundle\b/i],
          ["Report export JSON bundle builder", /\breport export JSON bundle builder\b/i],
          ["API-free comparison proof", /\bapi-free comparison proof\b/i],
          ["No optimizer", /\bno\b[\s\S]{0,80}\boptimizer\b/i],
          ["No recommendation", /\bno\b[\s\S]{0,80}\brecommendation\b/i],
          ["No clinical safety claims", /\bno\b[\s\S]{0,80}\bclinical safety claims\b/i],
          ["No API endpoints", /\bno\b[\s\S]{0,80}\bapi endpoints\b/i],
          ["No persistence", /\bno\b[\s\S]{0,80}\bpersistence\b/i],
          ["No PHI", /\bno\s+phi\b/i]
        ]
      }
    ]
  },
  {
    label: "Issue 069 Phase 8 evidence",
    paths: [
      "docs/verification/phase-8-export-review-evidence.md",
      "docs/verification/phase-8-export-review-checklist.md",
      "docs/verification/issues/issue-069/import-validation-output.json",
      "docs/verification/issues/issue-069/export-review-output.json",
      "docs/verification/issues/issue-069/screenshots/export-bundle-review-proof.png",
      "docs/verification/issues/issue-069/validation-output.txt",
      "docs/verification/issues/issue-069/commands.txt",
      "docs/verification/issues/issue-069/closeout.md"
    ],
    contentChecks: [
      {
        path: "docs/verification/phase-8-export-review-evidence.md",
        checks: [
          ["Report-centric comparison", /\breport-centric comparison\b/i],
          ["Deterministic timestamp", /\bdeterministic timestamp\b/i],
          ["Phase evidence gate registry", /\bphase evidence gate registry\b/i],
          ["Export bundle import validation", /\bexport bundle import validation\b/i],
          ["API-free export bundle review", /\bapi-free export bundle review\b/i],
          ["No optimizer", /\bno\b[\s\S]{0,80}\boptimizer\b/i],
          ["No recommendation", /\bno\b[\s\S]{0,80}\brecommendation\b/i],
          ["No API endpoints", /\bno\b[\s\S]{0,80}\bapi endpoints\b/i],
          ["No persistence", /\bno\b[\s\S]{0,80}\bpersistence\b/i],
          ["No file upload", /\bno\b[\s\S]{0,80}\bfile upload\b/i],
          ["No file download", /\bno\b[\s\S]{0,80}\bfile download\b/i],
          ["No PHI", /\bno\s+phi\b/i]
        ]
      },
      {
        path: "docs/verification/phase-8-export-review-checklist.md",
        checks: [
          ["Report-centric comparison", /\breport-centric comparison\b/i],
          ["Deterministic timestamp", /\bdeterministic timestamp\b/i],
          ["Phase evidence gate registry", /\bphase evidence gate registry\b/i],
          ["Export bundle import validation", /\bexport bundle import validation\b/i],
          ["API-free export bundle review", /\bapi-free export bundle review\b/i],
          ["No optimizer", /\bno\b[\s\S]{0,80}\boptimizer\b/i],
          ["No recommendation", /\bno\b[\s\S]{0,80}\brecommendation\b/i],
          ["No API endpoints", /\bno\b[\s\S]{0,80}\bapi endpoints\b/i],
          ["No persistence", /\bno\b[\s\S]{0,80}\bpersistence\b/i],
          ["No file upload", /\bno\b[\s\S]{0,80}\bfile upload\b/i],
          ["No file download", /\bno\b[\s\S]{0,80}\bfile download\b/i],
          ["No PHI", /\bno\s+phi\b/i]
        ]
      }
    ]
  },
  {
    label: "Issue 074 Phase 9 evidence",
    paths: [
      "docs/verification/phase-9-bundle-audit-evidence.md",
      "docs/verification/phase-9-bundle-audit-checklist.md",
      "docs/verification/issues/issue-074/integrity-output.json",
      "docs/verification/issues/issue-074/audit-output.json",
      "docs/verification/issues/issue-074/screenshots/bundle-audit-proof.png",
      "docs/verification/issues/issue-074/validation-output.txt",
      "docs/verification/issues/issue-074/commands.txt",
      "docs/verification/issues/issue-074/closeout.md"
    ],
    contentChecks: [
      {
        path: "docs/verification/phase-9-bundle-audit-evidence.md",
        checks: [
          ["Export bundle integrity", /\bexport bundle integrity\b/i],
          ["Bundle audit trail", /\bbundle audit trail\b/i],
          ["Read-only bundle audit", /\bread-only bundle audit\b/i],
          ["API-free bundle audit proof", /\bapi-free bundle audit proof\b/i],
          ["No file upload", /\bno\b[\s\S]{0,80}\bfile upload\b/i],
          ["No file download", /\bno\b[\s\S]{0,80}\bfile download\b/i],
          ["No API endpoints", /\bno\b[\s\S]{0,80}\bapi endpoints\b/i],
          ["No persistence", /\bno\b[\s\S]{0,80}\bpersistence\b/i],
          ["No optimizer", /\bno\b[\s\S]{0,80}\boptimizer\b/i],
          ["No recommendation", /\bno\b[\s\S]{0,80}\brecommendation\b/i],
          ["No legal compliance claim", /\bno\b[\s\S]{0,80}\blegal compliance claim\b/i],
          ["No tamper-proof claim", /\bno\b[\s\S]{0,80}\btamper-proof claim\b/i],
          ["No PHI", /\bno\s+phi\b/i]
        ]
      },
      {
        path: "docs/verification/phase-9-bundle-audit-checklist.md",
        checks: [
          ["Export bundle integrity", /\bexport bundle integrity\b/i],
          ["Bundle audit trail", /\bbundle audit trail\b/i],
          ["Read-only bundle audit", /\bread-only bundle audit\b/i],
          ["API-free bundle audit proof", /\bapi-free bundle audit proof\b/i],
          ["No file upload", /\bno\b[\s\S]{0,80}\bfile upload\b/i],
          ["No file download", /\bno\b[\s\S]{0,80}\bfile download\b/i],
          ["No API endpoints", /\bno\b[\s\S]{0,80}\bapi endpoints\b/i],
          ["No persistence", /\bno\b[\s\S]{0,80}\bpersistence\b/i],
          ["No optimizer", /\bno\b[\s\S]{0,80}\boptimizer\b/i],
          ["No recommendation", /\bno\b[\s\S]{0,80}\brecommendation\b/i],
          ["No legal compliance claim", /\bno\b[\s\S]{0,80}\blegal compliance claim\b/i],
          ["No tamper-proof claim", /\bno\b[\s\S]{0,80}\btamper-proof claim\b/i],
          ["No PHI", /\bno\s+phi\b/i]
        ]
      }
    ]
  },
  {
    label: "Issue 081 Plan Builder Input evidence",
    paths: [
      "docs/verification/phase-plan-builder-input-evidence.md",
      "docs/verification/phase-plan-builder-input-checklist.md",
      "docs/verification/issues/issue-081/defaults-output.json",
      "docs/verification/issues/issue-081/generated-plan-output.json",
      "docs/verification/issues/issue-081/screenshots/plan-builder-input-proof.png",
      "docs/verification/issues/issue-081/validation-output.txt",
      "docs/verification/issues/issue-081/commands.txt",
      "docs/verification/issues/issue-081/closeout.md"
    ],
    contentChecks: [
      {
        path: "docs/verification/phase-plan-builder-input-evidence.md",
        checks: [
          ["Plan Builder Defaults", /\bPlan Builder Defaults\b/i],
          ["Plan generation from defaults", /\bPlan generation from defaults\b/i],
          ["Plan setup input form", /\bPlan setup input form\b/i],
          ["Room defaults form", /\bRoom defaults form\b/i],
          ["Hallway door nurse station defaults", /\bHallway door nurse station defaults\b/i],
          ["Generated plan preview", /\bGenerated plan preview\b/i],
          ["Apply generated plan", /\bApply generated plan\b/i],
          ["No optimizer", /\bNo optimizer\b/i],
          ["No recommendation", /\bNo recommendation\b/i],
          ["No PHI", /\bNo PHI\b/i]
        ]
      },
      {
        path: "docs/verification/phase-plan-builder-input-checklist.md",
        checks: [
          ["Plan Builder Defaults", /\bPlan Builder Defaults\b/i],
          ["Plan generation from defaults", /\bPlan generation from defaults\b/i],
          ["Plan setup input form", /\bPlan setup input form\b/i],
          ["Room defaults form", /\bRoom defaults form\b/i],
          ["Hallway door nurse station defaults", /\bHallway door nurse station defaults\b/i],
          ["Generated plan preview", /\bGenerated plan preview\b/i],
          ["Apply generated plan", /\bApply generated plan\b/i],
          ["No optimizer", /\bNo optimizer\b/i],
          ["No recommendation", /\bNo recommendation\b/i],
          ["No PHI", /\bNo PHI\b/i]
        ]
      }
    ]
  },
  {
    label: "Phase Simulation Execution evidence",
    paths: [
      "docs/verification/phase-simulation-execution-evidence.md",
      "docs/verification/phase-simulation-execution-checklist.md",
      "docs/verification/issues/issue-082/simulation-run-contract-output.json",
      "docs/verification/issues/issue-083/simulation-output-basic.json",
      "docs/verification/issues/issue-083/simulation-output-surge.json",
      "docs/verification/issues/issue-084/nurse-queue-output.json",
      "docs/verification/issues/issue-085/path-travel-output.json",
      "docs/verification/issues/issue-086/scoring-output.json",
      "docs/verification/issues/issue-087/report-output.json",
      "docs/verification/issues/issue-088/screenshots/simulation-timeline-proof.png",
      "docs/verification/issues/issue-089/comparison-output.json",
      "docs/verification/issues/issue-090/variant-run-output.json",
      "docs/verification/issues/issue-091/optimization-contract-output.json",
      "docs/verification/issues/issue-092/optimizer-output.json",
      "docs/verification/issues/issue-093/optimizer-audit-output.json",
      "docs/verification/issues/issue-094/screenshots/optimizer-proof.png",
      "docs/verification/issues/issue-095/api-responses/simulation-validate-response.json",
      "docs/verification/issues/issue-096/api-responses/create-simulation-run-response.json",
      "docs/verification/issues/issue-097/review-findings.md",
      "docs/verification/issues/issue-097/batch-082-096-file-index.md",
      "docs/verification/issues/issue-097/hardening-plan.md",
      "docs/verification/issues/issue-097/test-output/shared.txt",
      "docs/verification/issues/issue-097/test-output/api.txt",
      "docs/verification/issues/issue-098/parity-output.json",
      "docs/verification/issues/issue-098/test-output/shared.txt",
      "docs/verification/issues/issue-098/test-output/api.txt",
      "docs/verification/issues/issue-099/missed-task-output.json",
      "docs/verification/issues/issue-099/test-output/shared.txt",
      "docs/verification/issues/issue-100/queue-contract-output.json",
      "docs/verification/issues/issue-100/test-output/shared.txt",
      "docs/verification/issues/issue-101/optimizer-constraint-output.json",
      "docs/verification/issues/issue-101/test-output/shared.txt",
      "docs/verification/issues/issue-102/assignment-reason-output.json",
      "docs/verification/issues/issue-102/test-output/shared.txt",
      "docs/verification/issues/issue-103/api-responses/list-simulation-runs-response.json",
      "docs/verification/issues/issue-103/api-responses/get-invalid-persisted-run-response.json",
      "docs/verification/issues/issue-103/test-output/api.txt",
      "docs/contracts/issue-evidence-output-contract.md",
      "docs/verification/issues/issue-104/test-output/evidence-output-gate.txt",
      "docs/verification/ISSUE_EVIDENCE_INDEX.json",
      "docs/verification/issues/issue-105/test-output/evidence-index-gate.txt",
      "docs/verification/issues/issue-106/test-output/determinism-cleanup.txt",
      "docs/verification/issues/issue-107/referential-integrity-output.json",
      "docs/verification/issues/issue-107/test-output/shared.txt",
      "docs/verification/issues/issue-107/test-output/api.txt",
      "docs/verification/issues/issue-108/lifecycle-ordering-output.json",
      "docs/verification/issues/issue-108/test-output/shared.txt",
      "docs/verification/issues/issue-108/test-output/api.txt",
      "docs/verification/issues/issue-082/commands.txt",
      "docs/verification/issues/issue-082/closeout.md",
      "docs/verification/issues/issue-083/commands.txt",
      "docs/verification/issues/issue-083/closeout.md",
      "docs/verification/issues/issue-084/commands.txt",
      "docs/verification/issues/issue-084/closeout.md",
      "docs/verification/issues/issue-085/commands.txt",
      "docs/verification/issues/issue-085/closeout.md",
      "docs/verification/issues/issue-086/commands.txt",
      "docs/verification/issues/issue-086/closeout.md",
      "docs/verification/issues/issue-087/commands.txt",
      "docs/verification/issues/issue-087/closeout.md",
      "docs/verification/issues/issue-088/commands.txt",
      "docs/verification/issues/issue-088/closeout.md",
      "docs/verification/issues/issue-089/commands.txt",
      "docs/verification/issues/issue-089/closeout.md",
      "docs/verification/issues/issue-090/commands.txt",
      "docs/verification/issues/issue-090/closeout.md",
      "docs/verification/issues/issue-091/commands.txt",
      "docs/verification/issues/issue-091/closeout.md",
      "docs/verification/issues/issue-092/commands.txt",
      "docs/verification/issues/issue-092/closeout.md",
      "docs/verification/issues/issue-093/commands.txt",
      "docs/verification/issues/issue-093/closeout.md",
      "docs/verification/issues/issue-094/commands.txt",
      "docs/verification/issues/issue-094/closeout.md",
      "docs/verification/issues/issue-095/commands.txt",
      "docs/verification/issues/issue-095/closeout.md",
      "docs/verification/issues/issue-096/commands.txt",
      "docs/verification/issues/issue-096/closeout.md",
      "docs/verification/issues/issue-097/commands.txt",
      "docs/verification/issues/issue-097/closeout.md",
      "docs/verification/issues/issue-098/commands.txt",
      "docs/verification/issues/issue-098/closeout.md",
      "docs/verification/issues/issue-099/commands.txt",
      "docs/verification/issues/issue-099/closeout.md",
      "docs/verification/issues/issue-100/commands.txt",
      "docs/verification/issues/issue-100/closeout.md",
      "docs/verification/issues/issue-101/commands.txt",
      "docs/verification/issues/issue-101/closeout.md",
      "docs/verification/issues/issue-102/commands.txt",
      "docs/verification/issues/issue-102/closeout.md",
      "docs/verification/issues/issue-103/commands.txt",
      "docs/verification/issues/issue-103/closeout.md",
      "docs/verification/issues/issue-104/commands.txt",
      "docs/verification/issues/issue-104/closeout.md",
      "docs/verification/issues/issue-105/commands.txt",
      "docs/verification/issues/issue-105/closeout.md",
      "docs/verification/issues/issue-106/commands.txt",
      "docs/verification/issues/issue-106/closeout.md",
      "docs/verification/issues/issue-107/commands.txt",
      "docs/verification/issues/issue-107/closeout.md",
      "docs/verification/issues/issue-108/commands.txt",
      "docs/verification/issues/issue-108/closeout.md"
    ],
    contentChecks: [
      {
        path: "docs/verification/phase-simulation-execution-evidence.md",
        checks: [
          ["simulation run contract", /\bsimulation run contract\b/i],
          ["deterministic task execution", /\bdeterministic task execution\b/i],
          ["operational queue", /\boperational queue\b/i],
          ["path travel", /\bpath travel\b/i],
          ["event-derived scoring", /\bevent-derived scoring\b|\bscoring derived from simulation events\b/i],
          ["API-free timeline proof", /\bAPI-free\b[\s\S]{0,80}\btimeline proof\b/i],
          ["optimizer boundary", /\boptimizer boundary\b/i],
          ["API validation", /\bAPI validation\b/i],
          ["persistence", /\bpersistence\b/i],
          ["No PHI", /\bNo PHI\b/i],
          ["No EHR integration", /\bNo EHR integration\b/i],
          ["No clinical safety claim", /\bNo clinical safety claim\b/i]
        ]
      },
      {
        path: "docs/verification/phase-simulation-execution-checklist.md",
        checks: [
          ["Simulation run contract", /\bSimulation run contract\b/i],
          ["Nurse queue", /\bNurse queue\b/i],
          ["Path travel", /\bPath travel\b/i],
          ["Simulation scoring", /\bSimulation scoring\b/i],
          ["API-free optimizer proof", /\bAPI-free optimizer proof\b/i],
          ["Simulation persistence", /\bSimulation persistence\b/i],
          ["No EHR integration", /\bNo EHR integration\b/i]
        ]
      }
    ]
  }
];
