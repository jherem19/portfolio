param(
    [Parameter(Mandatory=$true)][string]$PayloadPath,
    [string]$InstallRoot = (Join-Path $env:LOCALAPPDATA 'AEBridge'),
    [string]$AfterEffectsPath = '',
    [int]$Port = 0,
    [string]$IntegrationRoot = ''
)
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
$env:PSModulePath = Join-Path $PSHOME 'Modules'
[Console]::OutputEncoding = New-Object System.Text.UTF8Encoding($false)
$utf8 = New-Object System.Text.UTF8Encoding($false)
function Write-Text($file, $value) { [IO.File]::WriteAllText($file, $value, $utf8) }
function Full($value) { [IO.Path]::GetFullPath($value).TrimEnd([char[]]'\/') }
function Assert-Child($base, $target) {
    if (!(Full $target).StartsWith((Full $base) + '\', [StringComparison]::OrdinalIgnoreCase)) { throw 'Ruta fuera de la carpeta de instalacion.' }
}
function Remove-OwnedTree($base, $target) {
    Assert-Child $base $target
    if (Test-Path -LiteralPath $target) { Remove-Item -LiteralPath $target -Recurse -Force }
}
function Stop-OwnedBridge($appPath, $statePath) {
    $pidFile = Join-Path $statePath 'server.pid'
    if (!(Test-Path -LiteralPath $pidFile)) { return }
    $bridgeId = 0
    if (![int]::TryParse(([IO.File]::ReadAllText($pidFile)).Trim(), [ref]$bridgeId)) { return }
    $processInfo = Get-CimInstance Win32_Process -Filter "ProcessId=$bridgeId" -ErrorAction SilentlyContinue
    $serverPath = Join-Path $appPath 'bridge\server.js'
    $nodePath = Join-Path $appPath 'runtime\node.exe'
    if ($processInfo -and $processInfo.ExecutablePath -eq $nodePath -and $processInfo.CommandLine.Contains($serverPath)) {
        Stop-Process -Id $bridgeId -Force
        for ($attempt=0; $attempt -lt 30 -and (Get-Process -Id $bridgeId -ErrorAction SilentlyContinue); $attempt++) { Start-Sleep -Milliseconds 100 }
    }
}
function Free-Port([int]$candidate) {
    $v4=$null; $v6=$null
    try {
        $v4 = New-Object Net.Sockets.TcpListener([Net.IPAddress]::Loopback, $candidate)
        $v4.Server.ExclusiveAddressUse=$true; $v4.Start()
        if ([Net.Sockets.Socket]::OSSupportsIPv6) {
            $v6 = New-Object Net.Sockets.TcpListener([Net.IPAddress]::IPv6Loopback, $candidate)
            $v6.Server.ExclusiveAddressUse=$true; $v6.Start()
        }
        return $true
    } catch { return $false } finally { if($v4){$v4.Stop()}; if($v6){$v6.Stop()} }
}
function Start-Bridge($appPath, $config) {
    $nodePath = Join-Path $appPath 'runtime\node.exe'
    $serverPath = Join-Path $appPath 'bridge\server.js'
    Start-Process -FilePath $nodePath -ArgumentList ('"'+$serverPath+'"') -WindowStyle Hidden -WorkingDirectory $appPath
    for ($attempt=0; $attempt -lt 60; $attempt++) {
        try {
            $answer = Invoke-RestMethod -Uri ('http://127.0.0.1:'+$config.port+'/health') -Headers @{'X-Bridge-Token'=$config.token} -TimeoutSec 1
            if ($answer.ok -and $answer.version -eq '0.4.16') { return }
        } catch {}
        Start-Sleep -Milliseconds 200
    }
    throw 'El puente no pudo iniciarse. Revisa el puerto local o el bloqueo del antivirus.'
}
function Make-Link($file, $target, $arguments, $workingDirectory) {
    $shell=New-Object -ComObject WScript.Shell
    $link=$shell.CreateShortcut($file); $link.TargetPath=$target; $link.Arguments=$arguments
    $link.WorkingDirectory=$workingDirectory; $link.WindowStyle=7; $link.Save()
}
$installPath=Full $InstallRoot
if ($installPath -eq [IO.Path]::GetPathRoot($installPath) -or $installPath -eq (Full $env:USERPROFILE)) { throw 'Carpeta de instalacion invalida.' }
$markerPath=Join-Path $installPath 'installed.json'
$existing=$null; $oldConfig=$null; $oldStopped=$false; $switched=$false; $committed=$false; $wasNew=!(Test-Path -LiteralPath $installPath)
if (Test-Path -LiteralPath $installPath) {
    if (!(Test-Path -LiteralPath $markerPath)) { throw 'La carpeta ya existe y no pertenece a AE Bridge. Elige otra ubicacion.' }
    $existing=Get-Content -LiteralPath $markerPath -Raw | ConvertFrom-Json
    if ($existing.product -ne 'AEBridge' -or (Full $existing.root) -ne $installPath) { throw 'La carpeta no es una instalacion valida de AE Bridge.' }
    if (Test-Path -LiteralPath (Join-Path $installPath 'app\bridge\local-config.json')) {
        $oldConfig=Get-Content -LiteralPath (Join-Path $installPath 'app\bridge\local-config.json') -Raw | ConvertFrom-Json
    }
}
if (!$AfterEffectsPath) {
    $running=Get-CimInstance Win32_Process -Filter "Name='AfterFX.exe'" -ErrorAction SilentlyContinue | Where-Object ExecutablePath | Select-Object -First 1
    if ($running) { $AfterEffectsPath=$running.ExecutablePath }
}
if (!$AfterEffectsPath -and $oldConfig -and (Test-Path -LiteralPath $oldConfig.afterEffects)) { $AfterEffectsPath=$oldConfig.afterEffects }
if (!$AfterEffectsPath) {
    $candidates=@()
    foreach ($programFolder in @($env:ProgramW6432, $env:ProgramFiles)) {
        if (!$programFolder) { continue }
        $adobe=Join-Path $programFolder 'Adobe'
        if (Test-Path -LiteralPath $adobe) {
            $candidates += Get-ChildItem -LiteralPath $adobe -Directory -Filter 'Adobe After Effects*' | Sort-Object Name -Descending | ForEach-Object { Join-Path $_.FullName 'Support Files\AfterFX.exe' }
        }
    }
    $AfterEffectsPath=$candidates | Where-Object { Test-Path -LiteralPath $_ -PathType Leaf } | Select-Object -First 1
}
if (!$AfterEffectsPath -or !(Test-Path -LiteralPath $AfterEffectsPath -PathType Leaf) -or [IO.Path]::GetFileName($AfterEffectsPath) -ine 'AfterFX.exe') {
    throw 'No se encontro After Effects. Pulsa Examinar y selecciona AfterFX.exe.'
}
$AfterEffectsPath=Full $AfterEffectsPath
if ((Get-Item -LiteralPath $AfterEffectsPath).VersionInfo.ProductName -notmatch 'After Effects') { throw 'El archivo seleccionado no corresponde a Adobe After Effects.' }
if ([IntPtr]::Size -ne 8) { throw 'Este instalador requiere Windows de 64 bits.' }
if ($Port -ne 0 -and ($Port -lt 1024 -or $Port -gt 65535)) { throw 'Puerto invalido.' }
$parentPath=Split-Path -Parent $installPath
$stage=Join-Path $parentPath ('AEBridge-stage-'+[Guid]::NewGuid().ToString('N'))
$appPath=Join-Path $installPath 'app'
$backup=Join-Path $installPath ('app-backup-'+[Guid]::NewGuid().ToString('N'))
$statePath=Join-Path $installPath 'data\state'
try {
    Write-Output 'Verificando y extrayendo archivos...'
    New-Item -ItemType Directory -Path $stage -Force | Out-Null
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $archive=[IO.Compression.ZipFile]::OpenRead((Full $PayloadPath))
    try {
        foreach ($entry in $archive.Entries) { Assert-Child $stage (Join-Path $stage $entry.FullName) }
    } finally { $archive.Dispose() }
    [IO.Compression.ZipFile]::ExtractToDirectory((Full $PayloadPath), $stage)
    $fileHashes=Get-Content -LiteralPath (Join-Path $stage 'package-files.json') -Raw | ConvertFrom-Json
    foreach ($item in $fileHashes) {
        $target=Join-Path $stage $item.path; Assert-Child $stage $target
        if ((Get-FileHash -LiteralPath $target -Algorithm SHA256).Hash.ToLowerInvariant() -ne $item.sha256) { throw ('Archivo del paquete alterado: '+$item.path) }
    }
    $newApp=Join-Path $stage 'app'
    $nodePath=Join-Path $newApp 'runtime\node.exe'
    $version=& $nodePath '--version'
    if ($LASTEXITCODE -ne 0 -or $version -ne 'v24.19.0') { throw 'El runtime incluido no funciona en este Windows.' }
    if ($oldConfig) { Stop-OwnedBridge $appPath $statePath; $oldStopped=$true }
    $chosenPort=0
    if ($Port) { if (Free-Port $Port) { $chosenPort=$Port } }
    elseif ($oldConfig -and (Free-Port $oldConfig.port)) { $chosenPort=$oldConfig.port }
    else { for ($candidate=38473; $candidate -le 38503; $candidate++) { if (Free-Port $candidate) { $chosenPort=$candidate; break } } }
    if (!$chosenPort) { throw 'No hay un puerto local disponible para AE Bridge.' }
    $token=''
    if ($oldConfig -and $oldConfig.token -match '^[a-f0-9]{64}$') { $token=$oldConfig.token }
    else {
        $random=New-Object byte[] 32; $rng=[Security.Cryptography.RandomNumberGenerator]::Create()
        try { $rng.GetBytes($random) } finally { $rng.Dispose() }
        $token=([BitConverter]::ToString($random)).Replace('-','').ToLowerInvariant()
    }
    $config=[ordered]@{version=1;port=$chosenPort;token=$token;afterEffects=$AfterEffectsPath;stateDirectory=$statePath;assetsDirectory=(Join-Path $installPath 'data\assets')}
    Write-Text (Join-Path $newApp 'bridge\local-config.json') ($config | ConvertTo-Json)
    $manifestFile=Join-Path $newApp 'manifest.json'
    $manifest=Get-Content -LiteralPath $manifestFile -Raw | ConvertFrom-Json
    $manifest.networkAccess.allowedDomains=@('http://localhost:'+$chosenPort)
    $manifest.networkAccess | Add-Member -NotePropertyName devAllowedDomains -NotePropertyValue @('http://localhost:'+$chosenPort) -Force
    Write-Text $manifestFile ($manifest | ConvertTo-Json -Depth 10)
    & $nodePath (Join-Path $newApp 'build.js')
    if ($LASTEXITCODE -ne 0) { throw 'No se pudo configurar el plugin de Figma.' }
    New-Item -ItemType Directory -Force -Path $installPath,$statePath,$config.assetsDirectory | Out-Null
    Write-Output 'Instalando y comprobando el puente local...'
    if (Test-Path -LiteralPath $appPath) { Assert-Child $installPath $appPath; Assert-Child $installPath $backup; Move-Item -LiteralPath $appPath -Destination $backup }
    Move-Item -LiteralPath $newApp -Destination $appPath; $switched=$true
    Start-Bridge $appPath $config
    if ($IntegrationRoot) {
        $desktop=Join-Path (Full $IntegrationRoot) 'Desktop'; $startup=Join-Path (Full $IntegrationRoot) 'Startup'; $menu=Join-Path (Full $IntegrationRoot) 'Programs'
    } else {
        $desktop=[Environment]::GetFolderPath('DesktopDirectory'); $startup=[Environment]::GetFolderPath('Startup')
        $menu=Join-Path ([Environment]::GetFolderPath('Programs')) 'AE Bridge'
    }
    $wscript=Join-Path $env:WINDIR 'System32\wscript.exe'
    $launcher='"'+(Join-Path $appPath 'bridge\start.vbs')+'"'
    $linkPaths=@((Join-Path $desktop 'Iniciar AE Bridge.lnk'),(Join-Path $startup 'AE Bridge.lnk'),(Join-Path $menu 'Iniciar AE Bridge.lnk'))
    $pluginLink=Join-Path $menu 'Plugin para Figma.lnk'
    $guideLink=Join-Path $desktop 'AE Bridge - Primeros pasos.lnk'
    $guidePath=Join-Path $appPath 'Primeros-pasos.html'
    $template=[IO.File]::ReadAllText($guidePath)
    $manifestHtml=[Net.WebUtility]::HtmlEncode((Join-Path $appPath 'manifest.json'))
    Write-Text $guidePath ($template.Replace('__MANIFEST_PATH__',$manifestHtml).Replace('__AE_PATH__',[Net.WebUtility]::HtmlEncode($AfterEffectsPath)).Replace('__PAIRING_CODE__',('AEBridge:'+$chosenPort+':'+$token)))
    $uninstaller=Join-Path $appPath 'uninstall.vbs'
    $uninstallLink=Join-Path $menu 'Desinstalar AE Bridge.lnk'
    $record=[ordered]@{product='AEBridge';version='0.4.16';root=$installPath;links=@($linkPaths)+@($pluginLink,$guideLink,$uninstallLink);testMode=[bool]$IntegrationRoot}
    Write-Text $markerPath ($record | ConvertTo-Json -Depth 5)
    $committed=$true
    try {
        New-Item -ItemType Directory -Force -Path $desktop,$startup,$menu | Out-Null
        foreach($linkPath in $linkPaths){ Make-Link $linkPath $wscript $launcher $appPath }
        Make-Link $pluginLink (Join-Path $env:WINDIR 'explorer.exe') ('"'+$appPath+'"') $appPath
        Make-Link $guideLink $guidePath '' $appPath
        Make-Link $uninstallLink $wscript ('"'+$uninstaller+'"') $appPath
        if (!$IntegrationRoot) {
        $registry='HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\AEBridge'
        New-Item -Path $registry -Force | Out-Null
        $values=@{DisplayName='AE Bridge';DisplayVersion='0.4.16';InstallLocation=$installPath;UninstallString=('"'+$wscript+'" "'+$uninstaller+'"');NoModify=1;NoRepair=1}
        foreach($entry in $values.GetEnumerator()){ New-ItemProperty -Path $registry -Name $entry.Key -Value $entry.Value -PropertyType $(if($entry.Value -is [int]){'DWord'}else{'String'}) -Force | Out-Null }
        }
    } catch {
        Write-Output ('AVISO: el puente esta instalado, pero no se pudieron crear todos los accesos: '+$_.Exception.Message)
    }
    if (Test-Path -LiteralPath $backup) { Remove-OwnedTree $installPath $backup }
    Write-Output ('LISTO: '+(Join-Path $appPath 'manifest.json'))
} catch {
    $problem=$_
    if ($committed) { Write-Output ('AVISO: instalacion completada; limpieza pendiente: '+$problem.Exception.Message); Write-Output ('LISTO: '+(Join-Path $appPath 'manifest.json')) }
    else {
    if ($switched) {
        Stop-OwnedBridge $appPath $statePath
        Remove-OwnedTree $installPath $appPath
        if (Test-Path -LiteralPath $backup) { Assert-Child $installPath $backup; Move-Item -LiteralPath $backup -Destination $appPath }
    } elseif ((Test-Path -LiteralPath $backup) -and !(Test-Path -LiteralPath $appPath)) {
        Move-Item -LiteralPath $backup -Destination $appPath
    }
    if ($oldConfig -and $oldStopped) { try { Start-Bridge $appPath $oldConfig } catch {} }
    if ($wasNew -and (Test-Path -LiteralPath $installPath)) { Remove-OwnedTree $parentPath $installPath }
    throw $problem
    }
} finally {
    Remove-OwnedTree $parentPath $stage
}
