# Bump cache version from v=177 to v=178 across all HTML files,
# and ensure every <a ... class="logo"...> has dir="ltr" for Y-at-right alignment.

$files = @('index.html','movies.html','tvshows.html','search.html','mylist.html','watch.html','genre.html','profiles.html','intro.html','_test_seed.html')

foreach ($f in $files) {
  if (-not (Test-Path $f)) { continue }
  $c = Get-Content $f -Raw -Encoding UTF8

  # Bump cache version
  $c = $c -replace '\?v=177','?v=178'

  # Add dir="ltr" to <a ... class="logo"> if missing
  # Matches: <a href="..." class="logo"> (no dir attribute nearby)
  $c = [regex]::Replace($c, '(<a\s+[^>]*class="logo"[^>]*)(>)', {
    param($m)
    $tag = $m.Groups[1].Value
    if ($tag -match 'dir\s*=') {
      return $m.Value
    } else {
      return $tag + ' dir="ltr"' + $m.Groups[2].Value
    }
  })

  Set-Content -Path $f -Value $c -Encoding UTF8 -NoNewline
  Write-Host "Updated: $f"
}

Write-Host "Done."
