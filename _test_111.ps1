$r = Invoke-WebRequest -Uri 'https://111movies.com/movie/550' -UseBasicParsing -UserAgent "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" -TimeoutSec 15
$content = $r.Content
Write-Host "=== First 2000 chars ==="
Write-Host $content.Substring(0, [Math]::Min(2000, $content.Length))
Write-Host ""
Write-Host "=== Keywords found ==="
$keywords = @('player','hls','m3u8','jwplayer','video','iframe','stream','movie','tmdb','550','fight')
foreach ($k in $keywords) {
  if ($content -match $k) { Write-Host "  [+] $k" }
}
