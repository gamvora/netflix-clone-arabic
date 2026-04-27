# Updates all 6 HTML files:
# 1. Replaces old "nav-dropdown-menu" contents with new unified genre.html links
# 2. Bumps cache version to v=170
# Uses UTF-8 encoding (no BOM) throughout to preserve Arabic text

param([string]$Version = '170')

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)

# New dropdown HTML (links to unified genre.html)
$newDropdown = @'
          <ul class="nav-dropdown-menu">
            <li><a href="genre.html?type=action"><i class="fas fa-fist-raised"></i>أكشن</a></li>
            <li><a href="genre.html?type=comedy"><i class="fas fa-laugh"></i>كوميدي</a></li>
            <li><a href="genre.html?type=horror"><i class="fas fa-ghost"></i>رعب</a></li>
            <li><a href="genre.html?type=romance"><i class="fas fa-heart"></i>رومانسي</a></li>
            <li><a href="genre.html?type=scifi"><i class="fas fa-rocket"></i>خيال علمي</a></li>
            <li><a href="genre.html?type=thriller"><i class="fas fa-user-secret"></i>إثارة</a></li>
            <li><a href="genre.html?type=animation"><i class="fas fa-magic"></i>رسوم متحركة</a></li>
            <li><a href="genre.html?type=documentary"><i class="fas fa-film"></i>وثائقي</a></li>
            <li><a href="genre.html?type=crime"><i class="fas fa-mask"></i>جريمة</a></li>
            <li><a href="genre.html?type=drama"><i class="fas fa-theater-masks"></i>دراما</a></li>
            <li><a href="genre.html?type=fantasy"><i class="fas fa-hat-wizard"></i>فانتازيا</a></li>
            <li><a href="genre.html?type=adventure"><i class="fas fa-mountain"></i>مغامرة</a></li>
            <li><a href="genre.html?type=family"><i class="fas fa-users"></i>عائلي</a></li>
            <li><a href="genre.html?type=mystery"><i class="fas fa-search"></i>غموض</a></li>
            <li><a href="genre.html?type=war"><i class="fas fa-fighter-jet"></i>حرب</a></li>
            <li><a href="genre.html?type=korean"><i class="fas fa-star"></i>كوري</a></li>
            <li><a href="genre.html?type=anime"><i class="fas fa-dragon"></i>أنمي</a></li>
            <li><a href="genre.html?type=arabic"><i class="fas fa-moon"></i>عربي</a></li>
          </ul>
'@

$files = @('index.html','movies.html','tvshows.html','search.html','mylist.html','watch.html')

foreach ($f in $files) {
    if (-not (Test-Path $f)) { continue }
    
    # Read as UTF-8 explicitly
    $content = [System.IO.File]::ReadAllText($f, [System.Text.Encoding]::UTF8)
    
    # 1) Replace dropdown menu (regex across lines)
    # Match: <ul class="nav-dropdown-menu">...</ul>
    $pattern = '(?s)<ul class="nav-dropdown-menu">.*?</ul>'
    if ($content -match $pattern) {
        $content = [regex]::Replace($content, $pattern, $newDropdown.Trim())
        Write-Host "[$f] Dropdown replaced"
    } else {
        Write-Host "[$f] No dropdown found (skipped)"
    }
    
    # 2) Bump version: v=NNN → v=$Version
    $content = [regex]::Replace($content, 'v=\d+', "v=$Version")
    
    # Write back as UTF-8 WITHOUT BOM
    [System.IO.File]::WriteAllText((Resolve-Path $f), $content, $utf8NoBom)
    Write-Host "[$f] Saved with UTF-8 encoding (v=$Version)"
}

# Also bump genre.html version
if (Test-Path 'genre.html') {
    $c = [System.IO.File]::ReadAllText('genre.html', [System.Text.Encoding]::UTF8)
    $c = [regex]::Replace($c, 'v=\d+', "v=$Version")
    [System.IO.File]::WriteAllText((Resolve-Path 'genre.html'), $c, $utf8NoBom)
    Write-Host "[genre.html] Version bumped to v=$Version"
}

Write-Host "`nDone. All files updated with UTF-8 encoding."
