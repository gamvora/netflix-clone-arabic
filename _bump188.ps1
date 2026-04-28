# Bump version v=187 -> v=188 (HD badge redesign)
$ErrorActionPreference = 'Stop'

$htmlFiles = @(
  'index.html','movies.html','tvshows.html','search.html',
  'mylist.html','watch.html','genre.html','profiles.html','intro.html'
)

foreach ($file in $htmlFiles) {
  if (-not (Test-Path $file)) {
    Write-Host "SKIP  (not found): $file" -ForegroundColor Yellow
    continue
  }
  $content = Get-Content $file -Raw -Encoding UTF8
  $content = $content -replace '\?v=18[0-7]\b', '?v=188'
  Set-Content $file -Value $content -Encoding UTF8 -NoNewline
  Write-Host "OK    $file" -ForegroundColor Green
}

Write-Host ""
Write-Host "Done: v=187 -> v=188 (HD badge fix)" -ForegroundColor Cyan
