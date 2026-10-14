using System;
using System.IO;
using System.Reflection;
using System.Security.Cryptography;
using System.Diagnostics;
using System.Drawing;
using System.Windows.Forms;
using System.Threading.Tasks;
using System.Text;

[assembly: AssemblyTitle("AE Bridge — Instalador")]
[assembly: AssemblyDescription("Instalador local de Figma a After Effects")]
[assembly: AssemblyVersion("0.4.17.0")]
[assembly: AssemblyFileVersion("0.4.17.0")]

internal static class Setup {
    internal static string PayloadSha256 = "__PAYLOAD_SHA256__";
    internal static string LastLog;
    [STAThread]
    private static int Main(string[] args) {
        if (Array.IndexOf(args, "--silent") >= 0) {
            try {
                string result = Install(Option(args,"--install-root"),Option(args,"--after-effects"),Option(args,"--integration-root"),Option(args,"--port"));
                string resultFile=Option(args,"--result-file");
                if(!String.IsNullOrEmpty(resultFile)) File.WriteAllText(resultFile,result,Encoding.UTF8);
                return 0;
            } catch (Exception error) {
                string resultFile=Option(args,"--result-file");
                if(!String.IsNullOrEmpty(resultFile)) File.WriteAllText(resultFile,"ERROR: "+error.Message+"\r\nLog: "+LastLog,Encoding.UTF8);
                return 1;
            }
        }
        Application.EnableVisualStyles();
        Application.SetCompatibleTextRenderingDefault(false);
        Application.Run(new SetupForm());
        return 0;
    }
    private static string Option(string[] args,string name) {
        int position=Array.IndexOf(args,name);
        if(position<0) return "";
        if(position+1>=args.Length) throw new ArgumentException("Falta el valor de "+name);
        return args[position+1];
    }
    // Quote for Windows CreateProcess argument parsing; no command shell is involved.
    private static string Quote(string value) {
        StringBuilder result=new StringBuilder("\""); int slashes=0;
        foreach(char c in value) {
            if(c=='\\'){slashes++;continue;}
            if(c=='\"'){result.Append('\\',slashes*2+1);result.Append(c);slashes=0;continue;}
            result.Append('\\',slashes);slashes=0;result.Append(c);
        }
        result.Append('\\',slashes*2);result.Append('"');return result.ToString();
    }
    private static void Resource(string name,string destination) {
        using(Stream source=Assembly.GetExecutingAssembly().GetManifestResourceStream(name)) {
            if(source==null)throw new IOException("Falta un archivo del instalador: "+name);
            using(FileStream target=File.Create(destination))source.CopyTo(target);
        }
    }
    internal static string Install(string root,string afterEffects,string integration,string port) {
        string tempRoot=Path.Combine(Path.GetTempPath(),"AEBridge-setup-"+Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(tempRoot);
        string payload=Path.Combine(tempRoot,"payload.zip"),script=Path.Combine(tempRoot,"install.ps1");
        LastLog=Path.Combine(Path.GetTempPath(),"AEBridge-install-"+Guid.NewGuid().ToString("N")+".log");
        try {
            Resource("payload.zip",payload); Resource("install.ps1",script);
            using(SHA256 hash=SHA256.Create())using(FileStream file=File.OpenRead(payload)) {
                string actual=BitConverter.ToString(hash.ComputeHash(file)).Replace("-","").ToLowerInvariant();
                if(actual!=PayloadSha256)throw new IOException("El paquete del instalador está dañado.");
            }
            string powershell=Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.Windows),"System32","WindowsPowerShell","v1.0","powershell.exe");
            string arguments="-NoProfile -NonInteractive -ExecutionPolicy Bypass -File "+Quote(script)+" -PayloadPath "+Quote(payload);
            if(!String.IsNullOrEmpty(root))arguments+=" -InstallRoot "+Quote(root);
            if(!String.IsNullOrEmpty(afterEffects))arguments+=" -AfterEffectsPath "+Quote(afterEffects);
            if(!String.IsNullOrEmpty(integration))arguments+=" -IntegrationRoot "+Quote(integration);
            if(!String.IsNullOrEmpty(port))arguments+=" -Port "+Quote(port);
            ProcessStartInfo start=new ProcessStartInfo(powershell,arguments);
            start.UseShellExecute=false; start.CreateNoWindow=true;start.RedirectStandardOutput=true;start.RedirectStandardError=true;
            start.StandardOutputEncoding=Encoding.UTF8;start.StandardErrorEncoding=Encoding.UTF8;
            using(Process process=new Process()) {
                process.StartInfo=start;process.Start();
                Task<string> output=process.StandardOutput.ReadToEndAsync();Task<string> errors=process.StandardError.ReadToEndAsync();
                process.WaitForExit(); Task.WaitAll(output,errors);
                string log=output.Result+"\r\n"+errors.Result;
                File.WriteAllText(LastLog,log,Encoding.UTF8);
                if(process.ExitCode!=0)throw new IOException(String.IsNullOrWhiteSpace(errors.Result)?"No se pudo completar la instalación.":errors.Result.Trim());
                return log;
            }
        } finally {
            // Only the unique directory created by this invocation can be removed.
            if(Directory.Exists(tempRoot))Directory.Delete(tempRoot,true);
        }
    }
}

internal sealed class SetupForm : Form {
    private readonly TextBox aePath=new TextBox();
    private readonly Label status=new Label();
    private readonly Button install=new Button();
    private readonly Button browse=new Button();
    private readonly Button open=new Button();
    private readonly ProgressBar progress=new ProgressBar();
    private bool busy;
    internal SetupForm() {
        Text="AE Bridge · Instalador 0.4.17"; ClientSize=new Size(590,465);
        FormBorderStyle=FormBorderStyle.FixedDialog; MaximizeBox=false;StartPosition=FormStartPosition.CenterScreen;
        Font=new Font("Segoe UI",10);BackColor=Color.White;
        Label title=new Label{Text="Figma → After Effects",Font=new Font("Segoe UI",21,FontStyle.Bold),Location=new Point(28,26),Size=new Size(530,44)};
        Label introduction=new Label{Text="Envía capas a tu composición activa.\r\nIncluye el puente local y todo lo necesario para ejecutarlo.",Location=new Point(30,84),Size=new Size(530,56)};
        Label aeLabel=new Label{Text="After Effects (detección automática si lo dejas vacío)",Location=new Point(30,155),Size=new Size(525,26)};
        aePath.Location=new Point(30,188);aePath.Size=new Size(415,27);
        browse.Text="Examinar…";browse.Location=new Point(455,186);browse.Size=new Size(106,31);
        browse.Click+=delegate {using(OpenFileDialog picker=new OpenFileDialog()){picker.Title="Seleccionar After Effects";picker.Filter="Adobe After Effects|AfterFX.exe";if(picker.ShowDialog()==DialogResult.OK)aePath.Text=picker.FileName;}};
        Label location=new Label{Text="Se instala para tu usuario, sin permisos de administrador.\r\nEl puente se iniciará al entrar a Windows. Después deberás\r\nconectar el plugin con el código de Primeros pasos.",Location=new Point(30,235),Size=new Size(530,76)};
        progress.Location=new Point(30,328);progress.Size=new Size(530,12);progress.Visible=false;
        status.Location=new Point(30,353);status.Size=new Size(530,42);status.Text="Windows x64 · Conversión probada en After Effects 26.5";
        install.Text="Instalar";install.Location=new Point(435,411);install.Size=new Size(126,35);install.Click+=InstallClick;
        open.Text="Primeros pasos";open.Location=new Point(277,411);open.Size=new Size(145,35);open.Visible=false;
        open.Click+=delegate{Process.Start(Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),"AEBridge","app","Primeros-pasos.html"));};
        Controls.AddRange(new Control[]{title,introduction,aeLabel,aePath,browse,location,progress,status,install,open});
        FormClosing+=delegate(object sender,FormClosingEventArgs e){if(busy)e.Cancel=true;};
    }
    private async void InstallClick(object sender,EventArgs e) {
        if(install.Text=="Cerrar"){Close();return;}
        busy=true;install.Enabled=false;browse.Enabled=false;aePath.Enabled=false;
        progress.Visible=true;progress.Style=ProgressBarStyle.Marquee;status.Text="Instalando y comprobando el puente local…";
        string selected=aePath.Text.Trim();
        try {
            string report=await Task.Run(()=>Setup.Install("",selected,"",""));
            status.Text="Instalado. Abre Primeros pasos para añadirlo a Figma.";
            install.Text="Cerrar";open.Visible=true;
            if(report.Contains("AVISO:"))MessageBox.Show(report+"\r\nRegistro: "+Setup.LastLog,"AE Bridge — Accesos pendientes",MessageBoxButtons.OK,MessageBoxIcon.Warning);
        } catch(Exception error) {
            status.Text="La instalación no se completó. Puedes corregir la ruta y reintentar.";
            string message=error.Message;if(message.Length>1400)message=message.Substring(0,1400);
            MessageBox.Show(message+"\r\n\r\nRegistro: "+Setup.LastLog,"AE Bridge",MessageBoxButtons.OK,MessageBoxIcon.Error);
            browse.Enabled=true;aePath.Enabled=true;
        } finally {busy=false;install.Enabled=true;progress.Visible=false;}
    }
}
