$files = Get-ChildItem -Path . -Filter *.html -Recurse | Where-Object { $_.FullName -notmatch '\\_' }
foreach ($f in $files) {
  $c = Get-Content $f.FullName -Raw -Encoding UTF8
  $n = $c -replace 'v=183','v=184'
  if ($n -ne $c) {
    [System.IO.File]::WriteAllText($f.FullName, $n, (New-Object System.Text.UTF8Encoding $false))
    Write-Host "Updated $($f.Name)"
  }
}
Write-Host "DONE"
