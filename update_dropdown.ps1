# Updates the genre dropdown in all HTML files to point to genre.html?type=...
$OutputEncoding = [System.Text.UTF8Encoding]::new($true)
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($true)

$files = @('index.html','movies.html','tvshows.html','search.html','mylist.html','watch.html','genre.html')

$newDropdown = @"
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
"@

$pattern = '<ul class="nav-dropdown-menu">[\s\S]*?</ul>'

foreach ($f in $files) {
    if (Test-Path $f) {
        $content = Get-Content $f -Raw -Encoding UTF8
        $newContent = [regex]::Replace($content, $pattern, { param($m) $newDropdown })
        # Write with UTF-8 BOM to ensure Arabic renders correctly
        $utf8Bom = New-Object System.Text.UTF8Encoding($true)
        [System.IO.File]::WriteAllText((Resolve-Path $f).Path, $newContent, $utf8Bom)
        Write-Host "Updated: $f"
    } else {
        Write-Host "NOT FOUND: $f"
    }
}

Write-Host ""
Write-Host "Done! All dropdown links now point to genre.html?type=..."
