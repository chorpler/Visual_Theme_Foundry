$ErrorActionPreference = 'Stop'

function Test-TsServerTypingsSpawn {
    param(
        [string]$Label,
        [string[]]$Args
    )

    $proc = Start-Process -FilePath node -ArgumentList $Args -PassThru -WindowStyle Hidden
    Start-Sleep -Seconds 3

    $children = Get-CimInstance Win32_Process | Where-Object { $_.ParentProcessId -eq $proc.Id }
    $typingsChildren = $children | Where-Object { $_.CommandLine -match 'typingsInstaller\.js|_typingsInstaller\.js' }

    $result = [PSCustomObject]@{
        Label                   = $Label
        ParentPid               = $proc.Id
        TsserverAlive           = (-not $proc.HasExited)
        ChildCount              = @($children).Count
        TypingsInstallerSpawned = (@($typingsChildren).Count -gt 0)
        TypingsInstallerPids    = (@($typingsChildren | Select-Object -ExpandProperty ProcessId) -join ',')
    }

    if (-not $proc.HasExited) {
        Stop-Process -Id $proc.Id -Force
    }

    foreach ($child in $children) {
        try { Stop-Process -Id $child.ProcessId -Force -ErrorAction SilentlyContinue } catch {}
    }

    return $result
}

$probeLog = '_imports/tsserver_probe.log'
if (Test-Path $probeLog) { Remove-Item $probeLog -Force }

$results = @()
$results += Test-TsServerTypingsSpawn -Label 'default' -Args @('_imports/typescript/lib/tsserver.js', '--logVerbosity', 'verbose', '--logFile', $probeLog)
$results += Test-TsServerTypingsSpawn -Label 'disableAutomaticTypingAcquisition' -Args @('_imports/typescript/lib/tsserver.js', '--disableAutomaticTypingAcquisition', '--logVerbosity', 'verbose', '--logFile', $probeLog)

$results | ConvertTo-Json -Depth 4
