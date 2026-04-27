# Bump cache version v=179 -> v=180 across all HTML files
$files = Get-ChildItem -Path . -Filter "*.html" -Recurse -File | Where-Object { $_.FullName -notmatch "node_modules|\.git" }
$count = 0
foreach ($f in $files) {
    $content = Get-Content -Path $f.FullName -Raw -Encoding UTF8
    if ($content -match "v=179") {
        $new = $content -replace "v=179", "v=180"
        Set-Content -Path $f.FullName -Value $new -Encoding UTF8 -NoNewline
        Write-Host "Bumped: $($f.FullName)"
        $count++
    }
}
Write-Host ""
Write-Host "Total files bumped: $count"
