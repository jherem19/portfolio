$ErrorActionPreference='Stop'
$env:PSModulePath=Join-Path $PSHOME 'Modules'
$rootPath=[IO.Path]::GetFullPath((Split-Path -Parent $PSScriptRoot)).TrimEnd([char[]]'\/')
$appPath=Join-Path $rootPath 'app'
function Child($path){if(!([IO.Path]::GetFullPath($path)).StartsWith($rootPath+'\',[StringComparison]::OrdinalIgnoreCase)){throw 'Ruta fuera de AE Bridge.'}}
try {
    $markerFile=Join-Path $rootPath 'installed.json'
    $record=Get-Content -LiteralPath $markerFile -Raw | ConvertFrom-Json
    if($record.product -ne 'AEBridge' -or $record.root -ne $rootPath){throw 'Instalacion no reconocida.'}
    $pidFile=Join-Path $rootPath 'data\state\server.pid'; $bridgeId=0
    if((Test-Path -LiteralPath $pidFile) -and [int]::TryParse(([IO.File]::ReadAllText($pidFile)).Trim(),[ref]$bridgeId)){
        $processInfo=Get-CimInstance Win32_Process -Filter "ProcessId=$bridgeId" -ErrorAction SilentlyContinue
        $nodePath=Join-Path $appPath 'runtime\node.exe'; $serverPath=Join-Path $appPath 'bridge\server.js'
        if($processInfo -and $processInfo.ExecutablePath -eq $nodePath -and $processInfo.CommandLine.Contains($serverPath)){
            Stop-Process -Id $bridgeId -Force
            for($attempt=0;$attempt -lt 30 -and (Get-Process -Id $bridgeId -ErrorAction SilentlyContinue);$attempt++){Start-Sleep -Milliseconds 100}
        }
    }
    $shell=New-Object -ComObject WScript.Shell
    foreach($linkFile in $record.links){
        if((Test-Path -LiteralPath $linkFile) -and [IO.Path]::GetExtension($linkFile) -eq '.lnk'){
            $link=$shell.CreateShortcut($linkFile)
            if(($link.Arguments -and $link.Arguments.Contains($appPath)) -or ($link.TargetPath -and $link.TargetPath.StartsWith($appPath+'\',[StringComparison]::OrdinalIgnoreCase))){Remove-Item -LiteralPath $linkFile -Force}
        }
    }
    if(!$record.testMode){
        $registry='HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\AEBridge'
        if((Get-ItemProperty -Path $registry -ErrorAction SilentlyContinue).InstallLocation -eq $rootPath){Remove-Item -LiteralPath $registry -Force}
    }
    Child $appPath
    Remove-Item -LiteralPath $appPath -Recurse -Force
    $record | Add-Member -NotePropertyName uninstalled -NotePropertyValue $true -Force
    [IO.File]::WriteAllText($markerFile,($record | ConvertTo-Json -Depth 5),(New-Object Text.UTF8Encoding($false)))
} catch {
    $errorFile=Join-Path $rootPath 'data\state\uninstall-error.txt'
    if(Test-Path -LiteralPath (Split-Path -Parent $errorFile)){[IO.File]::WriteAllText($errorFile,($_ | Out-String))}
    exit 1
}
