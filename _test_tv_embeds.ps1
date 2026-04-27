$urls = @(
  'https://vidsrc.cc/v2/embed/tv/1399/1/1',
  'https://111movies.com/tv/1399/1/1',
  'https://vidsrc.xyz/embed/tv/1399/1/1',
  'https://www.2embed.cc/embedtv/1399&s=1&e=1',
  'https://vidsrc.icu/embed/tv/1399/1/1'
)
foreach ($u in $urls) {
  try {
    $r = Invoke-WebRequest -Uri $u -Method Get -MaximumRedirection 5 -TimeoutSec 10 -UseBasicParsing -UserAgent "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    $size = if ($r.RawContent) { $r.RawContent.Length } else { 0 }
    $title = if ($r.Content -match '<title[^>]*>([^<]*)</title>') { $matches[1] } else { '(no title)' }
    $hasIframe = if ($r.Content -match '<iframe') { 'IFRAME' } else { '-' }
    $hasVideo = if ($r.Content -match '<video|player\.src|hls\.js|jwplayer|\.m3u8') { 'VIDEO' } else { '-' }
    Write-Host "[$($r.StatusCode)] $u"
    Write-Host "    size=$size  title=`"$title`"  $hasIframe  $hasVideo"
  } catch {
    Write-Host "[FAIL] $u"
    Write-Host "    $($_.Exception.Message)"
  }
}
