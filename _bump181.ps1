# Bump all cache-busting ?v=NNN refs to v=181 across HTML files
# Targets: js/player.js, js/utils.js, css/player.css (server 2 change)
$targetVersion = 181
$files = Get-ChildItem -Path . -Filter *.html -File
$totalReplacements = 0

foreach ($f in $files) {
    $content = Get-Content -Path $f.FullName -Raw -Encoding UTF8
    $original = $content
    # Replace ?v=NNN with ?v=181 for any js/css asset reference
    $content = [regex]::Replace($content, '(\.(?:js|css))\?v=\d+', "`$1?v=$targetVersion")
    if ($content -ne $original) {
        Set-Content -Path $f.FullName -Value $content -Encoding UTF8 -NoNewline
        $count = ([regex]::Matches($original, '\?v=\d+')).Count
        Write-Host "[$($f.Name)] bumped $count refs -> v=$targetVersion"
        $totalReplacements += $count
    }
}
Write-Host ""
Write-Host "Done. Total refs updated: $totalReplacements"
Write-Host "Target version: v=$targetVersion"
