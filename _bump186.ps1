# Bump v=185 -> v=186 across all HTML files AND inject tv-mode.css link
$ErrorActionPreference = 'Stop'
$files = @(
  'index.html','movies.html','tvshows.html','search.html','mylist.html',
  'watch.html','genre.html','profiles.html','intro.html'
)

foreach ($f in $files) {
  if (-not (Test-Path $f)) { Write-Host "SKIP $f (not found)"; continue }
  $c = Get-Content $f -Raw -Encoding UTF8

  # 1) Bump version
  $c = $c -replace 'v=185', 'v=186'

  # 2) Inject tv-mode.css AFTER netflix-polish.css link (only once, if missing)
  if ($c -notmatch 'tv-mode\.css') {
    $pattern  = '(<link rel="stylesheet" href="css/netflix-polish\.css\?v=\d+">)'
    $replace  = '$1' + "`r`n  " + '<link rel="stylesheet" href="css/tv-mode.css?v=186">'
    $c = [System.Text.RegularExpressions.Regex]::Replace($c, $pattern, $replace, 1)
  }

  Set-Content $f -Value $c -Encoding UTF8 -NoNewline
  Write-Host "UPDATED $f"
}
Write-Host "Done. Version bumped to v=186 and tv-mode.css injected."
