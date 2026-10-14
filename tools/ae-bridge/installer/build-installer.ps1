param([string]$NodeArchive = (Join-Path $PSScriptRoot '..\..\work\installer-build\node-v24.19.0-win-x64.zip'))
$ErrorActionPreference='Stop'
$workspace=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\..\..'))
$buildRoot=Join-Path $workspace 'work\installer-build'
$sourceRoot=Join-Path $workspace 'tools\ae-bridge\app'
$packageVersion=(Get-Content -LiteralPath (Join-Path $sourceRoot 'version.json') -Raw | ConvertFrom-Json).version
if($packageVersion -notmatch '^\d+\.\d+\.\d+$'){throw 'Invalid package version'}
$stage=Join-Path $buildRoot ('payload-'+[Guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Force -Path $stage | Out-Null
$app=Join-Path $stage 'app'
New-Item -ItemType Directory -Force -Path $app,(Join-Path $app 'runtime'),(Join-Path $app 'src'),(Join-Path $app 'bridge') | Out-Null
foreach($file in @('build.js','version.json')){Copy-Item -LiteralPath (Join-Path $sourceRoot $file) -Destination $app}
foreach($file in @('core.js','ae-runtime.js','exporter.js','ui-direct.template.html')){Copy-Item -LiteralPath (Join-Path $sourceRoot ('src\'+$file)) -Destination (Join-Path $app 'src')}
foreach($file in @('server.js','validate.js','result-json.js','assets.js')){Copy-Item -LiteralPath (Join-Path $sourceRoot ('bridge\'+$file)) -Destination (Join-Path $app 'bridge')}
Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'start.vbs') -Destination (Join-Path $app 'bridge')
foreach($file in @('uninstall.ps1','uninstall.vbs','Primeros-pasos.html')){Copy-Item -LiteralPath (Join-Path $PSScriptRoot $file) -Destination $app}
$manifest=Get-Content -LiteralPath (Join-Path $sourceRoot 'manifest.json') -Raw | ConvertFrom-Json
$manifest.name='AE Bridge'
# Existing Figma-assigned development ID; no per-machine secrets are packaged.
$manifest | Add-Member -NotePropertyName id -NotePropertyValue '1690443548274107140' -Force
$utf8=New-Object Text.UTF8Encoding($false)
[IO.File]::WriteAllText((Join-Path $app 'manifest.json'),($manifest | ConvertTo-Json -Depth 10),$utf8)
$expected='57f71ab3652e797d84acddc79c81cc9ff1c6ddb2a1974cdb83f00fee9bff4c73'
if((Get-FileHash -LiteralPath $NodeArchive -Algorithm SHA256).Hash.ToLowerInvariant() -ne $expected){throw 'La descarga de Node.js no coincide con el SHA256 oficial.'}
Add-Type -AssemblyName System.IO.Compression.FileSystem
$archive=[IO.Compression.ZipFile]::OpenRead([IO.Path]::GetFullPath($NodeArchive))
try {
    foreach($name in @('node.exe','LICENSE')){
        $entry=$archive.GetEntry('node-v24.19.0-win-x64/'+$name)
        if(!$entry){throw ('Falta '+$name+' en la descarga oficial.')}
        [IO.Compression.ZipFileExtensions]::ExtractToFile($entry,(Join-Path $app ('runtime\'+$name)),$true)
    }
} finally {$archive.Dispose()}
$checks=Get-ChildItem -LiteralPath $stage -File -Recurse | ForEach-Object {
    [ordered]@{path=$_.FullName.Substring($stage.Length+1).Replace('\','/');sha256=(Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash.ToLowerInvariant()}
}
[IO.File]::WriteAllText((Join-Path $stage 'package-files.json'),($checks | ConvertTo-Json -Depth 3),$utf8)
$payload=Join-Path $buildRoot 'payload.zip'
if(Test-Path -LiteralPath $payload){Remove-Item -LiteralPath $payload -Force}
[IO.Compression.ZipFile]::CreateFromDirectory($stage,$payload,[IO.Compression.CompressionLevel]::Optimal,$false)
$payloadHash=(Get-FileHash -LiteralPath $payload -Algorithm SHA256).Hash.ToLowerInvariant()
$compiledSource=Join-Path $buildRoot 'Setup.cs'
[IO.File]::WriteAllText($compiledSource,([IO.File]::ReadAllText((Join-Path $PSScriptRoot 'Setup.cs'))).Replace('__PAYLOAD_SHA256__',$payloadHash),$utf8)
$output=Join-Path $workspace ('outputs\AE-Bridge-Setup-'+$packageVersion+'.exe')
$compiler=Join-Path $env:WINDIR 'Microsoft.NET\Framework64\v4.0.30319\csc.exe'
& $compiler /nologo /target:winexe /platform:x64 /optimize+ /reference:System.Windows.Forms.dll /reference:System.Drawing.dll ('/resource:'+ $payload+',payload.zip') ('/resource:'+(Join-Path $PSScriptRoot 'install.ps1')+',install.ps1') ('/out:'+$output) $compiledSource
if($LASTEXITCODE -ne 0){throw 'No se pudo compilar el instalador.'}
$stageFull=[IO.Path]::GetFullPath($stage)
if(!$stageFull.StartsWith(([IO.Path]::GetFullPath($buildRoot))+'\',[StringComparison]::OrdinalIgnoreCase)){throw 'Ruta temporal invalida.'}
Remove-Item -LiteralPath $stageFull -Recurse -Force
Get-Item -LiteralPath $output | Select-Object Name,Length
Get-FileHash -LiteralPath $output -Algorithm SHA256
