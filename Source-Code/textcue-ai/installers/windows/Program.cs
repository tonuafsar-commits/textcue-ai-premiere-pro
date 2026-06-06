using System.Diagnostics;

const string packageFile = "TextCue-AI-Premiere-Windows.ccx";
const string upiaPath = @"C:\Program Files\Common Files\Adobe\Adobe Desktop Common\RemoteComponents\UPI\UnifiedPluginInstallerAgent\UnifiedPluginInstallerAgent.exe";
const int installTimeoutSeconds = 120;

Console.Title = "TextCue AI Premiere Installer";
Console.WriteLine("TextCue AI Premiere Pro UXP Installer");
Console.WriteLine("--------------------------------------");
Console.WriteLine("Requires: official Adobe Creative Cloud Desktop and Premiere Pro 25.6 or newer.");
Console.WriteLine();

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
Console.WriteLine("Checking installed Adobe plugin hosts...");
RunUpiaList();
Console.WriteLine();
Console.WriteLine("Installing through Adobe Unified Plugin Installer Agent...");
Console.WriteLine($"If Adobe shows a prompt, respond to it. This installer will stop after {installTimeoutSeconds} seconds if UPIA does not finish.");

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

var outputTask = process!.StandardOutput.ReadToEndAsync();
var errorTask = process.StandardError.ReadToEndAsync();
var finished = process.WaitForExit(installTimeoutSeconds * 1000);

if (!finished)
{
    try
    {
        process.Kill(entireProcessTree: true);
    }
    catch
    {
        // UPIA may already be closing.
    }

    Fail(
        "The Adobe installer did not finish.\n\n" +
        "Most common reasons:\n" +
        "- Premiere Pro 25.6 or newer is not installed through Adobe Creative Cloud Desktop.\n" +
        "- Creative Cloud Desktop cannot see the installed Premiere app.\n" +
        "- The installed Premiere build does not support UXP plugins.\n\n" +
        "Try double-clicking the .ccx file after opening Creative Cloud Desktop, or install via UXP Developer Tool."
    );
}

var output = outputTask.Result;
var error = errorTask.Result;

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

static void RunUpiaList()
{
    try
    {
        using var listProcess = Process.Start(new ProcessStartInfo
        {
            FileName = upiaPath,
            Arguments = "/list all",
            UseShellExecute = false,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            CreateNoWindow = true
        });

        if (listProcess == null)
        {
            Console.WriteLine("Could not run UPIA list check.");
            return;
        }

        if (!listProcess.WaitForExit(15000))
        {
            listProcess.Kill(entireProcessTree: true);
            Console.WriteLine("UPIA list check timed out.");
            return;
        }

        var listOutput = listProcess.StandardOutput.ReadToEnd();
        var listError = listProcess.StandardError.ReadToEnd();
        if (!string.IsNullOrWhiteSpace(listOutput)) Console.WriteLine(listOutput);
        if (!string.IsNullOrWhiteSpace(listError)) Console.WriteLine(listError);
    }
    catch (Exception ex)
    {
        Console.WriteLine($"UPIA list check failed: {ex.Message}");
    }
}

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
