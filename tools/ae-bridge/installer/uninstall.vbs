Option Explicit
Dim shell, fso, appFolder, scriptFile, powershell, command
Set shell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
If MsgBox("Desinstalar AE Bridge? Se conservaran las imagenes utilizadas por tus proyectos.", 36, "AE Bridge") <> 6 Then WScript.Quit
appFolder = fso.GetParentFolderName(WScript.ScriptFullName)
scriptFile = fso.BuildPath(appFolder, "uninstall.ps1")
powershell = shell.ExpandEnvironmentStrings("%WINDIR%\System32\WindowsPowerShell\v1.0\powershell.exe")
command = Chr(34) & powershell & Chr(34) & " -NoProfile -ExecutionPolicy Bypass -File " & Chr(34) & scriptFile & Chr(34)
If shell.Run(command, 0, True) = 0 Then
    MsgBox "AE Bridge desinstalado. Se conservaron los assets. Quita tambien el plugin de Desarrollo en Figma.", 64, "AE Bridge"
Else
    MsgBox "No se pudo completar la desinstalacion. Consulta data\state\uninstall-error.txt en la carpeta de AE Bridge.", 16, "AE Bridge"
End If
