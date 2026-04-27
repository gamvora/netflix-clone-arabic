Get-ChildItem -Path . -Filter *.html | ForEach-Object {
    $file = $_.FullName
    $content = Get-Content -Path $file -Raw
    $updated = $content -replace 'profile-guard\.js\?v=\d+', 'profile-guard.js?v=176'
    Set-Content -Path $file -Value $updated -NoNewline
    Write-Host "Updated: $($_.Name)"
}
