\# Extension Packaging Instructions



When asked to "package," "zip," or "prepare the extension for Firefox," follow these exact steps using PowerShell.



\## 1. Environment Requirements

\- Ensure `manifest.json`, `icon.png`, `index.html`, and the folders `dist/` and `img/` are present in the root.

\- The `icon.png` must be 48x48 pixels.



\## 2. Automated Build \& Increment Script

Execute the following PowerShell block. It automatically:

1\.  \*\*Increments Version\*\*: Reads `manifest.json`, bumps the version (e.g., 2.2 -> 2.3).

2\.  \*\*Syncs ID\*\*: Ensures the ID is set to `newtab@local`.

3\.  \*\*Sanitizes Manifest\*\*: Removes problematic data collection keys and forces UTF8 (No BOM) encoding.

4\.  \*\*Creates Valid ZIP\*\*: Uses .NET compression to ensure forward slashes (`/`) in file paths, preventing Firefox validation errors.



```powershell

\# --- CONFIGURATION ---

$manifestPath = "manifest.json"

$assets = @("dist", "img", "index.html", "icon.png", "manifest.json")

$staging = "build\_staging"



\# --- 1. VERSION BUMP \& MANIFEST SYNC ---

$m = Get-Content $manifestPath -Raw | ConvertFrom-Json

$currentVer = \[version]$m.version

$newVer = "{0}.{1}" -f $currentVer.Major, ($currentVer.Minor + 1)

$m.version = $newVer



\# Ensure ID and Firefox specific settings

$geckoSettings = @{

&nbsp;   "id" = "newtab@local";

&nbsp;   "strict\_min\_version" = "109.0"

}

if ($m.browser\_specific\_settings) { $m.browser\_specific\_settings.gecko = $geckoSettings } 

else { $m | Add-Member -NotePropertyName "browser\_specific\_settings" -NotePropertyValue @{ "gecko" = $geckoSettings } }



\# Remove problematic keys if they exist

if ($m.browser\_specific\_settings.gecko.PSObject.Properties\['data\_collection\_permissions']) {

&nbsp;   $m.browser\_specific\_settings.gecko.PSObject.Properties.Remove('data\_collection\_permissions')

}



\# Force Icons mapping

$m.icons = @{ "48" = "icon.png" }



\# Save with UTF8 No BOM

$manifestJson = $m | ConvertTo-Json -Depth 10

\[System.IO.File]::WriteAllText((Resolve-Path $manifestPath), $manifestJson)



\# --- 2. PACKAGING ---

$pkgName = "firefox\_v$($newVer.Replace('.','\_'))\_submission.zip"

if (Test-Path $staging) { Remove-Item -Recurse -Force $staging }

if (Test-Path $pkgName) { Remove-Item $pkgName }



New-Item -ItemType Directory -Path $staging | Out-Null

foreach ($item in $assets) {

&nbsp;   if (Test-Path $item) { Copy-Item -Path $item -Destination $staging -Recurse -Force }

}



\# Use .NET for forward-slash path compatibility

Add-Type -AssemblyName System.IO.Compression.FileSystem

\[System.IO.Compression.ZipFile]::CreateFromDirectory((Resolve-Path $staging).Path, (Join-Path (Get-Location) $pkgName))



Remove-Item -Recurse -Force $staging

Write-Host "SUCCESS: Bumped to $newVer and created $pkgName" -ForegroundColor Green

