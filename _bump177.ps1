# Bump cache version 176 -> 177 across all HTML files
Get-ChildItem -Path . -Filter '*.html' | ForEach-Object {
    $content = Get-Content $_.FullName -Raw -Encoding UTF8
    $updated = $content -replace 'v=176', 'v=177'
    if ($content -ne $updated) {
        Set-Content -Path $_.FullName -Value $updated -NoNewline -Encoding UTF8
        Write-Host "Updated: $($_.Name)"
    }
}
Write-Host "Done. Cache version = v=177"
