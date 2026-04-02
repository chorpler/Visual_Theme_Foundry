param(
    [string]$Source = "C:\Users\Mike\.claude\CLAUDE.md",
    [string]$Target = ".github\copilot-instructions.md"
)

if (!(Test-Path $Source)) {
    Write-Error "Source not found: $Source"
    exit 1
}

Copy-Item $Source $Target -Force
Write-Host "Synced $Source -> $Target"
