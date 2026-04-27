# Test TV URLs for candidate servers
$tests = @(
  @{ name='moviesapi TV';  url='https://moviesapi.club/tv/1399/1/1' }
  @{ name='moviesapi.to TV'; url='https://moviesapi.to/tv/1399-1-1' }
  @{ name='smashy TV';     url='https://embed.smashystream.com/playere.php?tmdb=1399&season=1&episode=1' }
  @{ name='moviesapi alt'; url='https://moviesapi.club/tv/1399-1-1' }
)
foreach ($t in $tests) {
  try {
    $r = Invoke-WebRequest -Uri $t.url -Method Head -TimeoutSec 8 -MaximumRedirection 5 -ErrorAction Stop
    Write-Host ("{0,-18} {1} - {2}" -f $t.name, $r.StatusCode, $r.BaseResponse.ResponseUri.AbsoluteUri)
  } catch {
    Write-Host ("{0,-18} FAIL: {1}" -f $t.name, $_.Exception.Message.Split("`n")[0])
  }
}
