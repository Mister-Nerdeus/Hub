param(
    [Parameter(Mandatory = $true)]
    [string]$Path
)

$ErrorActionPreference = "Stop"

node scripts/validate-plan-contract.mjs $Path
exit $LASTEXITCODE
