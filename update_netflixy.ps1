# Update all HTML files to NETFLIXY branding + add profile guard + bump version
$files = 'movies.html','tvshows.html','search.html','mylist.html','genre.html','watch.html'

$yHtml = '<span style="color:#fff;background:#e50914;padding:0 6px;border-radius:4px;display:inline-block;transform:rotate(-4deg);margin-right:-2px;">Y</span>'
$yLogo = '<span class="logo-y">Y</span>'

foreach ($f in $files) {
  if (-not (Test-Path $f)) { Write-Host "Skipping (not found): $f"; continue }

  $c = Get-Content $f -Raw -Encoding UTF8

  # 1. Title / meta
  $c = $c -replace '<title>Netflix', '<title>NETFLIXY'
  $c = [regex]::Replace($c, 'منصة Netflix', 'منصة NETFLIXY')
  $c = [regex]::Replace($c, 'Netflix Clone - مشروع تعليمي', 'NETFLIXY - مشروع تعليمي')
  $c = [regex]::Replace($c, 'Netflix - الرئيسية', 'NETFLIXY - الرئيسية')

  # 2. Loader & logo branding
  $c = $c -replace 'class="loader-logo">NETFLIX</div>', ('class="loader-logo">NETFLIX' + $yHtml + '</div>')
  $c = $c -replace 'class="logo">NETFLIX</a>', ('class="logo">NETFLIX' + $yLogo + '</a>')

  # 3. Nav profile placeholder (remove hardcoded "U")
  $c = [regex]::Replace($c, 'class="nav-profile" title="الملف الشخصي">U</div>', 'class="nav-profile" title="البروفايل"></div>')
  $c = [regex]::Replace($c, 'class="nav-profile"[^>]*>U</div>', 'class="nav-profile" title="البروفايل"></div>')

  # 4. Bump cache version
  $c = $c -replace '\?v=174', '?v=175'

  # 5. Add profile guard scripts (once) — insert before </head>
  if ($c -notmatch 'profile-guard\.js') {
    $guardBlock = "`n  <!-- Profile guard: redirects to profiles.html / intro.html if no active profile -->`n  <script src=""js/profiles.js?v=175""></script>`n  <script src=""js/profile-guard.js?v=175""></script>`n"
    $c = $c -replace '</head>', ($guardBlock + '</head>')
  }

  Set-Content -Path $f -Value $c -Encoding UTF8 -NoNewline
  Write-Host "Updated: $f"
}

Write-Host ""
Write-Host "Done. NETFLIXY branding + profile guard applied." -ForegroundColor Green
