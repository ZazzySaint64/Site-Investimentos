# Used by abrir-site.bat. Frees the port when an older copy of this site holds it.
# Exit code: 0 = port free, 1 = this folder's site already runs there, 2 = another program holds it.
param([int]$Porta = 3000, [string]$Pasta = (Get-Location).Path)

function Dono {
    Get-NetTCPConnection -LocalPort $Porta -State Listen -ErrorAction SilentlyContinue |
        Select-Object -First 1 -ExpandProperty OwningProcess
}

$dono = Dono
if (-not $dono) { exit 0 }

$processo = Get-CimInstance Win32_Process -Filter "ProcessId=$dono"
$linha = [string]$processo.CommandLine
if ($linha.ToLower().Contains("$Pasta\node_modules".ToLower())) { exit 1 }
if ($linha -notmatch 'Site-Investimentos.*node_modules.*next') { exit 2 }

Write-Host "Encerrando outra copia do site que estava na porta $Porta..."
$pai = Get-CimInstance Win32_Process -Filter "ProcessId=$($processo.ParentProcessId)"
$alvo = if ([string]$pai.CommandLine -match 'node_modules.*next') { $pai.ProcessId } else { $dono }
taskkill /F /T /PID $alvo | Out-Null

foreach ($tentativa in 1..20) {
    if (-not (Dono)) { exit 0 }
    Start-Sleep -Milliseconds 500
}
exit 2
