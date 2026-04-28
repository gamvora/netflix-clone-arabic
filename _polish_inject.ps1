# Injects css/netflix-polish.css into all HTML pages (after responsive.css or after style.css)
# Also bumps version from v=182 -> v=183 so browsers refresh CSS/JS.

$ErrorActionPreference = 'Stop'
$htmlFiles = Get-ChildItem -Path . -Filter *.html -File
$newVer = '183'
$polishTag = '<link rel="stylesheet" href="css/netflix-polish.css?v=' + $newVer + '">'

foreach ($file in $htmlFiles) {
    $path = $file.FullName
    $content = Get-Content -Raw -Path $path

    # Bump cache versions (v=... numbers) to 183 for css and js assets
    $content = [regex]::Replace($content, '(\?v=)(\d+)', {
        param($m)
        $m.Groups[1].Value + '183'
    })

    # Skip if already injected
    if ($content -match 'netflix-polish\.css') {
        # Ensure version is 183
        $content = [regex]::Replace($content, 'netflix-polish\.css\?v=\d+', 'netflix-polish.css?v=' + $newVer)
        Set-Content -Path $path -Value $content -NoNewline -Encoding UTF8
        Write-Host ("[bump]   " + $file.Name)
        continue
    }

    # Prefer injecting AFTER responsive.css link, fallback AFTER style.css link
    $injected = $false
    $respPattern = '(<link[^>]*href="css/responsive\.css[^"]*"[^>]*>)'
    $stylePattern = '(<link[^>]*href="css/style\.css[^"]*"[^>]*>)'

    if ([regex]::IsMatch($content, $respPattern)) {
        $content = [regex]::Replace($content, $respPattern, '$1' + "`r`n    " + $polishTag, 1)
        $injected = $true
    } elseif ([regex]::IsMatch($content, $stylePattern)) {
        $content = [regex]::Replace($content, $stylePattern, '$1' + "`r`n    " + $polishTag, 1)
        $injected = $true
    } else {
        # Fallback: inject before </head>
        if ($content -match '</head>') {
            $content = $content -replace '</head>', ("    " + $polishTag + "`r`n</head>")
            $injected = $true
        }
    }

    if ($injected) {
        Set-Content -Path $path -Value $content -NoNewline -Encoding UTF8
        Write-Host ("[inject] " + $file.Name)
    } else {
        Write-Host ("[skip]   " + $file.Name + " (no <head> found)")
    }
}

Write-Host ""
Write-Host "Done. All HTML pages now reference css/netflix-polish.css?v=$newVer"
