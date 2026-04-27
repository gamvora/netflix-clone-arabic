# Bump cache version from v=178 to v=179 across HTML files.
$files = @('index.html','movies.html','tvshows.html','search.html','mylist.html','watch.html','genre.html','profiles.html','intro.html','_test_seed.html')
foreach ($f in $files) {
  if (-not (Test-Path $f)) { continue }
  $c = Get-Content $f -Raw -Encoding UTF8
  $c = $c -replace '\?v=178','?v=179'
  Set-Content -Path $f -Value $c -Encoding UTF8 -NoNewline
  Write-Host "Bumped: $f"
}
Write-Host "Done."
