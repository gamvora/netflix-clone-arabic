param([string]$NewVersion = "160")

$files = Get-ChildItem -Path . -Filter *.html
foreach ($f in $files) {
    $content = Get-Content $f.FullName -Raw
    $content = [regex]::Replace($content, 'v=\d+', "v=$NewVersion")
    Set-Content -Path $f.FullName -Value $content -NoNewline
    Write-Host "Updated: $($f.Name) -> v=$NewVersion"
}
Write-Host "Done. Bumped $($files.Count) HTML files."
