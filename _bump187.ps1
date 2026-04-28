# Bump version v=186 -> v=187 and inject cards-hover.css link across HTML files
$ErrorActionPreference = 'Stop'

$htmlFiles = @(
  'index.html','movies.html','tvshows.html','search.html',
  'mylist.html','watch.html','genre.html','profiles.html','intro.html'
)

$cardsLink = '<link rel="stylesheet" href="css/cards-hover.css?v=187">'

foreach ($file in $htmlFiles) {
  if (-not (Test-Path $file)) {
    Write-Host "SKIP  (not found): $file" -ForegroundColor Yellow
    continue
  }

  $content = Get-Content $file -Raw -Encoding UTF8

  # 1) Bump version v=186 -> v=187 (also handle older versions just in case)
  $content = $content -replace '\?v=18[0-6]\b', '?v=187'

  # 2) Inject cards-hover.css link right after tv-mode.css if not already present
  if ($content -notmatch 'cards-hover\.css') {
    if ($content -match 'tv-mode\.css\?v=\d+"\s*>') {
      $content = $content -replace '(tv-mode\.css\?v=\d+"\s*>)', "`$1`r`n    $cardsLink"
    }
    elseif ($content -match 'netflix-polish\.css\?v=\d+"\s*>') {
      $content = $content -replace '(netflix-polish\.css\?v=\d+"\s*>)', "`$1`r`n    $cardsLink"
    }
  } else {
    # Already has it - just make sure version is 187
    $content = $content -replace 'cards-hover\.css\?v=\d+', 'cards-hover.css?v=187'
  }

  Set-Content $file -Value $content -Encoding UTF8 -NoNewline
  Write-Host "OK    $file" -ForegroundColor Green
}

Write-Host ""
Write-Host "Done: v=186 -> v=187 + cards-hover.css linked" -ForegroundColor Cyan
