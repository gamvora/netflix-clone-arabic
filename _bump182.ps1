# Bump cache version v=180 -> v=182 for all HTML files
$files = Get-ChildItem -Path . -Filter *.html
foreach ($f in $files) {
    $content = Get-Content $f.FullName -Raw -Encoding UTF8
    $new = $content -replace 'v=18[01]', 'v=182' -replace 'v=17[0-9]', 'v=182'
    if ($new -ne $content) {
        Set-Content -Path $f.FullName -Value $new -Encoding UTF8 -NoNewline
        Write-Host "Bumped: $($f.Name)"
    }
}
Write-Host "Done."
