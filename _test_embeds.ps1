$urls = @(
  'https://vidjoy.pro/embed/movie/550',
  'https://player.videasy.net/movie/550',
  'https://vidsrc.xyz/embed/movie/550',
  'https://vidsrc.icu/embed/movie/550',
  'https://www.2embed.cc/embed/550',
  'https://multiembed.mov/?video_id=550&tmdb=1',
  'https://embed.smashystream.com/playere.php?tmdb=550',
  'https://moviee.tv/embed/movie/550',
  'https://vidsrc.dev/embed/movie/550',
  'https://111movies.com/movie/550',
  'https://vidsrc.cc/v2/embed/movie/550',
  'https://rivestream.net/embed?type=movie&id=550',
  'https://iframe.pstream.org/embed/tmdb-movie-550'
)
foreach ($u in $urls) {
  try {
    $r = Invoke-WebRequest -Uri $u -Method Get -MaximumRedirection 5 -TimeoutSec 10 -UseBasicParsing -UserAgent "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    $size = if ($r.RawContent) { $r.RawContent.Length } else { 0 }
    $title = if ($r.Content -match '<title[^>]*>([^<]*)</title>') { $matches[1] } else { '(no title)' }
    $hasIframe = if ($r.Content -match '<iframe') { 'IFRAME' } else { '-' }
    $hasVideo = if ($r.Content -match '<video|player\.src|hls\.js|jwplayer') { 'VIDEO' } else { '-' }
    Write-Host "[$($r.StatusCode)] $u"
    Write-Host "    size=$size  title=`"$title`"  $hasIframe  $hasVideo"
  } catch {
    Write-Host "[FAIL] $u"
    Write-Host "    $($_.Exception.Message)"
  }
}
