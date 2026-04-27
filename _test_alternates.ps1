# Test alternative embed providers for server 2
$providers = @(
  @{ Name='vidjoy.pro';      Movie='https://vidjoy.pro/embed/movie/550';          Tv='https://vidjoy.pro/embed/tv/1399/1/1' },
  @{ Name='vidsrc.icu';      Movie='https://vidsrc.icu/embed/movie/550';          Tv='https://vidsrc.icu/embed/tv/1399/1/1' },
  @{ Name='111movies.com';   Movie='https://111movies.com/movie/550';             Tv='https://111movies.com/tv/1399/1/1' },
  @{ Name='smashy.stream';   Movie='https://embed.smashystream.com/playere.php?tmdb=550'; Tv='https://embed.smashystream.com/playere.php?tmdb=1399&season=1&episode=1' },
  @{ Name='embed.su';        Movie='https://embed.su/embed/movie/550';            Tv='https://embed.su/embed/tv/1399/1/1' },
  @{ Name='vidora.stream';   Movie='https://vidora.stream/movie/550';             Tv='https://vidora.stream/tv/1399/1/1' },
  @{ Name='warezcdn.link';   Movie='https://warezcdn.link/filme/550';             Tv='https://warezcdn.link/serie/1399/1/1' },
  @{ Name='vidzee.wtf';      Movie='https://player.vidzee.wtf/embed/movie/550';   Tv='https://player.vidzee.wtf/embed/tv/1399/1/1' },
  @{ Name='autoembed.cc';    Movie='https://player.autoembed.cc/embed/movie/550'; Tv='https://player.autoembed.cc/embed/tv/1399/1/1' }
)

foreach ($p in $providers) {
  Write-Host ""
  Write-Host "=== $($p.Name) ===" -ForegroundColor Cyan
  foreach ($kind in @('Movie','Tv')) {
    $u = $p[$kind]
    try {
      $r = Invoke-WebRequest -Uri $u -Method GET -UseBasicParsing -TimeoutSec 15 -MaximumRedirection 5 -ErrorAction Stop
      $len = $r.RawContentLength
      if (-not $len) { $len = $r.Content.Length }
      Write-Host ("  [{0}] {1}  status={2}  bytes={3}" -f $kind, $u, $r.StatusCode, $len) -ForegroundColor Green
    } catch {
      Write-Host ("  [{0}] {1}  ERROR: {2}" -f $kind, $u, $_.Exception.Message) -ForegroundColor Red
    }
  }
}
