using System.Diagnostics;

const string packageFile = "TextCue-AI-Premiere-Windows.ccx";
const string upiaPath = @"C:\Program Files\Common Files\Adobe\Adobe Desktop Common\RemoteComponents\UPI\UnifiedPluginInstallerAgent\UnifiedPluginInstallerAgent.exe";

Console.Title = "TextCue AI Premiere Installer";
Console.WriteLine("TextCue AI Premiere Pro UXP Installer");
Console.WriteLine("--------------------------------------");

var baseDirectory = AppContext.BaseDirectory;
var packagePath = Path.Combine(baseDirectory, packageFile);

if (!File.Exists(packagePath))
{
    Fail($"Could not find {packageFile} next to this installer.\nFolder checked: {baseDirectory}");
}

if (!File.Exists(upiaPath))
{
    Fail(
        "Adobe Unified Plugin Installer Agent was not found.\n\n" +
        "Install or update Adobe Creative Cloud Desktop, then try again.\n" +
        $"Expected path:\n{upiaPath}"
    );
}

Console.WriteLine("Found package:");
Console.WriteLine(packagePath);
Console.WriteLine();
Console.WriteLine("Installing through Adobe Unified Plugin Installer Agent...");

var process = Process.Start(new ProcessStartInfo
{
    FileName = upiaPath,
    Arguments = $"/install \"{packagePath}\"",
    UseShellExecute = false,
    RedirectStandardOutput = true,
    RedirectStandardError = true,
    CreateNoWindow = false
});

if (process == null)
{
    Fail("Could not start Adobe Unified Plugin Installer Agent.");
}

var output = process!.StandardOutput.ReadToEnd();
var error = process.StandardError.ReadToEnd();
process.WaitForExit();

if (!string.IsNullOrWhiteSpace(output))
{
    Console.WriteLine(output);
}

if (!string.IsNullOrWhiteSpace(error))
{
    Console.Error.WriteLine(error);
}

if (process.ExitCode != 0)
{
    Fail($"Installation failed with exit code {process.ExitCode}.\nSee SOLUTION - Install and Use Problems.txt for fixes.");
}

Console.WriteLine("Installation command completed.");
Console.WriteLine("Restart Premiere Pro, then open Window > UXP Plugins > TextCue AI.");
Console.WriteLine("Press any key to close.");
Console.ReadKey(true);
return;

static void Fail(string message)
{
    Console.ForegroundColor = ConsoleColor.Red;
    Console.WriteLine();
    Console.WriteLine(message);
    Console.ResetColor();
    Console.WriteLine();
    Console.WriteLine("Press any key to close.");
    Console.ReadKey(true);
    Environment.Exit(1);
}
