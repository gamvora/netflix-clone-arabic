$files = @('index.html','movies.html','tvshows.html','search.html','mylist.html','watch.html','genre.html','profiles.html','intro.html')
foreach ($f in $files) {
  if (Test-Path $f) {
    $c = Get-Content $f -Raw -Encoding UTF8
    $c = $c -replace 'v=184','v=185'
    Set-Content $f -Value $c -Encoding UTF8 -NoNewline
    Write-Host "Bumped: $f"
  }
}
Write-Host "Done"
