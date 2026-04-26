$servers = @(
    'https://vidsrc.cc/v2/embed/movie/550',
    'https://vidsrc.xyz/embed/movie?tmdb=550',
    'https://vidsrc.to/embed/movie/550',
    'https://vidsrc.pm/embed/movie?tmdb=550',
    'https://player.autoembed.cc/embed/movie/550',
    'https://autoembed.co/movie/tmdb/550',
    'https://www.2embed.cc/embed/550',
    'https://embed.su/embed/movie/550',
    'https://moviesapi.club/movie/550',
    'https://vidlink.pro/movie/550',
    'https://multiembed.mov/?video_id=550&tmdb=1',
    'https://vidbinge.dev/embed/movie/550',
    'https://embed.smashystream.com/playere.php?tmdb=550',
    'https://www.primewire.tf/embed/tmdb-movie-550',
    'https://moviee.tv/embed/movie/550',
    'https://ghostx.site/embed/movie/550'
)
foreach ($s in $servers) {
    try {
        $r = Invoke-WebRequest -Uri $s -UseBasicParsing -TimeoutSec 8 -MaximumRedirection 5 -ErrorAction Stop
        $len = $r.Content.Length
        Write-Host "OK [$($r.StatusCode)] size=$len - $s"
    }
    catch {
        $msg = $_.Exception.Message
        if ($msg.Length -gt 80) { $msg = $msg.Substring(0, 80) }
        Write-Host "FAIL - $s :: $msg"
    }
}
