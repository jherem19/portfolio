Option Explicit
Dim shell, fso, bridgeFolder, appFolder, nodeExe, serverFile
Set shell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
bridgeFolder = fso.GetParentFolderName(WScript.ScriptFullName)
appFolder = fso.GetParentFolderName(bridgeFolder)
nodeExe = fso.BuildPath(appFolder, "runtime\node.exe")
serverFile = fso.BuildPath(bridgeFolder, "server.js")
If Not fso.FileExists(nodeExe) Then
    MsgBox "Falta el runtime de AE Bridge. Ejecuta de nuevo el instalador.", 16, "AE Bridge"
    WScript.Quit 1
End If
shell.CurrentDirectory = appFolder
shell.Run Chr(34) & nodeExe & Chr(34) & " " & Chr(34) & serverFile & Chr(34), 0, False
