# Test alternative streaming servers
$servers = @(
  @{ name='moviesapi.club';      url='https://moviesapi.club/movie/550' }
  @{ name='smashystream';        url='https://embed.smashystream.com/playere.php?tmdb=550' }
  @{ name='multiembed';          url='https://multiembed.mov/?video_id=550&tmdb=1' }
  @{ name='autoembed.cc';        url='https://player.autoembed.cc/embed/movie/550' }
  @{ name='moviee.tv';           url='https://moviee.tv/embed/movie/550' }
  @{ name='vidbinge';            url='https://vidbinge.dev/embed/movie/550' }
  @{ name='vidsrc.me';           url='https://vidsrc.me/embed/movie?tmdb=550' }
  @{ name='vidsrc.cc';           url='https://vidsrc.cc/v2/embed/movie/550' }
  @{ name='warezcdn';            url='https://embed.warezcdn.link/filme/tt0137523' }
  @{ name='filmu';               url='https://filmu.fun/embed/movie/550' }
  @{ name='superembed';          url='https://multiembed.mov/directstream.php?video_id=550&tmdb=1' }
  @{ name='embed.rip';           url='https://embed.rip/movie/550' }
  @{ name='moviebox';            url='https://moviebox.ph/embed/550' }
  @{ name='frembed';             url='https://frembed.icu/api/film.php?id=550' }
  @{ name='nontongo';            url='https://www.NontonGo.win/embed/movie/550' }
  @{ name='rivestream';          url='https://rivestream.live/embed?type=movie&id=550' }
  @{ name='letsembed';           url='https://letsembed.cc/embed/movie/?id=550' }
)

foreach ($s in $servers) {
  try {
    $r = Invoke-WebRequest -Uri $s.url -Method Head -TimeoutSec 8 -MaximumRedirection 5 -ErrorAction Stop
    Write-Host ("{0,-16} {1} - {2}" -f $s.name, $r.StatusCode, $r.BaseResponse.ResponseUri.AbsoluteUri)
  } catch {
    $code = 'ERR'
    if ($_.Exception.Response) { $code = [int]$_.Exception.Response.StatusCode }
    Write-Host ("{0,-16} FAIL ({1}): {2}" -f $s.name, $code, $_.Exception.Message.Split("`n")[0])
  }
}
