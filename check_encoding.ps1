$files = @('js/config.js','js/genre.js','js/utils.js','js/api.js','index.html','genre.html','movies.html','tvshows.html','search.html','mylist.html','watch.html')
foreach ($f in $files) {
    if (Test-Path $f) {
        $b = [System.IO.File]::ReadAllBytes($f)
        $hasBom = ($b.Length -ge 3) -and ($b[0] -eq 0xEF) -and ($b[1] -eq 0xBB) -and ($b[2] -eq 0xBF)
        # Check for question-marks-as-Arabic by scanning
        $text = [System.Text.Encoding]::UTF8.GetString($b)
        $hasArabic = [regex]::IsMatch($text, '[\u0600-\u06FF]')
        $suspiciousQMarks = ([regex]::Matches($text, '\?\?\?+')).Count
        Write-Host ("{0,-22} BOM={1,-5} Arabic={2,-5} QQQ={3} Size={4}B" -f $f, $hasBom, $hasArabic, $suspiciousQMarks, $b.Length)
    }
}
