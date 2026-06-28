param(
  [int]$Port = 5501,
  [string]$Root = (Split-Path -Parent $PSCommandPath),
  [switch]$LocalOnly
)

$sharedLeaderboardPath = Join-Path $Root 'shared-leaderboard.json'
$sharedRoomsPath = Join-Path $Root 'shared-rooms.json'
$sharedWeeklyCompPath = Join-Path $Root 'shared-weekly-comp.json'
$sharedModerationPath = Join-Path $Root 'shared-moderation.json'
$ownerName = 'Bob123meep'
$ownerPassword = 'Bob123meep'

function Parse-QueryString([string]$Query) {
  $result = @{}
  if ([string]::IsNullOrWhiteSpace($Query)) { return $result }
  foreach ($pair in ($Query.TrimStart('?') -split '&')) {
    if ([string]::IsNullOrWhiteSpace($pair)) { continue }
    $kv = $pair -split '=', 2
    $k = [Uri]::UnescapeDataString($kv[0])
    $v = if ($kv.Length -gt 1) { [Uri]::UnescapeDataString($kv[1]) } else { '' }
    if (-not [string]::IsNullOrWhiteSpace($k)) { $result[$k] = $v }
  }
  return $result
}

function Sanitize-Username([string]$Name) {
  if ($null -eq $Name) { return '' }
  $n = ($Name -replace '\s+', ' ').Trim()
  if ($n.Length -gt 24) { $n = $n.Substring(0, 24) }
  return $n
}

function Normalize-Ip([string]$Ip) {
  $i = ([string]$Ip).Trim()
  if ($i -eq '::1') { return '127.0.0.1' }
  if ($i.StartsWith('::ffff:')) { return $i.Substring(7) }
  return $i
}

function Get-SafeInt([object]$Value) {
  $n = 0
  if ([int]::TryParse([string]$Value, [ref]$n)) { return [Math]::Max(0, $n) }
  return 0
}

function Get-HashtableFromJsonFile([string]$Path) {
  if (-not (Test-Path $Path)) { return @{} }
  try {
    $raw = Get-Content $Path -Raw -Encoding UTF8
    if ([string]::IsNullOrWhiteSpace($raw)) { return @{} }
    $obj = $raw | ConvertFrom-Json
    if ($obj -is [System.Collections.IDictionary]) { return $obj }
    $map = @{}
    if ($obj -and $obj.PSObject.Properties) {
      foreach ($p in $obj.PSObject.Properties) { $map[$p.Name] = $p.Value }
    }
    return $map
  } catch {
    return @{}
  }
}

function Save-HashtableAsJson([hashtable]$Map, [string]$Path) {
  $json = $Map | ConvertTo-Json -Depth 12
  Set-Content -Path $Path -Value $json -Encoding UTF8
}

function Get-SharedLeaderboardMap { return Get-HashtableFromJsonFile -Path $sharedLeaderboardPath }
function Save-SharedLeaderboardMap([hashtable]$Map) { Save-HashtableAsJson -Map $Map -Path $sharedLeaderboardPath }

function Merge-SharedAccount([hashtable]$Map, [string]$Username, [hashtable]$Q) {
  $name = Sanitize-Username $Username
  if ([string]::IsNullOrWhiteSpace($name)) { return }

  $existing = $Map[$name]
  if (-not $existing) {
    $existing = [ordered]@{
      username = $name
      createdAt = (Get-Date).ToString('o')
      lastSeen = (Get-Date).ToString('o')
      totalPlays = 0
      totalScore = 0
      bestScore = 0
      rankPoints = 0
      level = 1
      credits = 0
      tokens = 0
      rankName = 'Dirt'
      role = if ($name -ieq $ownerName) { 'owner' } else { 'player' }
      streakCount = 0
      streakFreezes = 0
      profilePic = if ($name -ieq $ownerName) { 'crown-owner' } else { 'fox' }
      gameStats = @{}
    }
  } else {
    $normalized = [ordered]@{
      username = $name
      createdAt = [string]$existing.createdAt
      lastSeen = [string]$existing.lastSeen
      totalPlays = Get-SafeInt $existing.totalPlays
      totalScore = Get-SafeInt $existing.totalScore
      bestScore = Get-SafeInt $existing.bestScore
      rankPoints = Get-SafeInt $existing.rankPoints
      level = [Math]::Max(1, (Get-SafeInt $existing.level))
      credits = Get-SafeInt $existing.credits
      tokens = Get-SafeInt $existing.tokens
      rankName = if ([string]::IsNullOrWhiteSpace([string]$existing.rankName)) { 'Dirt' } else { [string]$existing.rankName }
      role = if ([string]::IsNullOrWhiteSpace([string]$existing.role)) { 'player' } else { [string]$existing.role }
      streakCount = Get-SafeInt $existing.streakCount
      streakFreezes = Get-SafeInt $existing.streakFreezes
      profilePic = if ([string]::IsNullOrWhiteSpace([string]$existing.profilePic)) { if ($name -ieq $ownerName) { 'crown-owner' } else { 'fox' } } else { [string]$existing.profilePic }
      gameStats = if ($existing.gameStats) { $existing.gameStats } else { @{} }
    }
    if ([string]::IsNullOrWhiteSpace([string]$normalized.createdAt)) {
      $normalized.createdAt = (Get-Date).ToString('o')
    }
    if ([string]::IsNullOrWhiteSpace([string]$normalized.lastSeen)) {
      $normalized.lastSeen = (Get-Date).ToString('o')
    }
    $existing = $normalized
  }

  $existing.totalPlays = [Math]::Max((Get-SafeInt $existing.totalPlays), (Get-SafeInt $Q['totalPlays']))
  $existing.totalScore = [Math]::Max((Get-SafeInt $existing.totalScore), (Get-SafeInt $Q['totalScore']))
  $existing.bestScore = [Math]::Max((Get-SafeInt $existing.bestScore), (Get-SafeInt $Q['bestScore']))
  $existing.rankPoints = [Math]::Max((Get-SafeInt $existing.rankPoints), (Get-SafeInt $Q['rankPoints']))
  $existing.level = [Math]::Max([Math]::Max(1, (Get-SafeInt $existing.level)), [Math]::Max(1, (Get-SafeInt $Q['level'])))
  $existing.credits = [Math]::Max((Get-SafeInt $existing.credits), (Get-SafeInt $Q['credits']))
  $existing.tokens = [Math]::Max((Get-SafeInt $existing.tokens), (Get-SafeInt $Q['tokens']))
  $existing.streakCount = [Math]::Max((Get-SafeInt $existing.streakCount), (Get-SafeInt $Q['streakCount']))
  $existing.streakFreezes = [Math]::Max((Get-SafeInt $existing.streakFreezes), (Get-SafeInt $Q['streakFreezes']))

  $incomingRankName = [string]$Q['rankName']
  $incomingRole = [string]$Q['role']
  $incomingProfilePic = [string]$Q['profilePic']
  if (-not [string]::IsNullOrWhiteSpace($incomingRankName)) { $existing.rankName = $incomingRankName }
  if (-not [string]::IsNullOrWhiteSpace($incomingProfilePic)) { $existing.profilePic = $incomingProfilePic }

  if ($name -ieq $ownerName) {
    $existing.role = 'owner'
  } else {
    $currentRole = [string]$existing.role
    if ([string]::IsNullOrWhiteSpace($currentRole)) {
      $nextRole = ([string]$incomingRole).ToLowerInvariant()
      if ($nextRole -notin @('player', 'helper', 'mod', 'admin')) { $nextRole = 'player' }
      $existing.role = $nextRole
    } else {
      $currentRole = $currentRole.ToLowerInvariant()
      if ($currentRole -notin @('player', 'helper', 'mod', 'admin', 'owner')) {
        $existing.role = 'player'
      }
    }
  }

  $incomingCreatedAt = [string]$Q['createdAt']
  $incomingLastSeen = [string]$Q['lastSeen']
  if (-not [string]::IsNullOrWhiteSpace($incomingCreatedAt)) { $existing.createdAt = $incomingCreatedAt }
  $existing.lastSeen = if (-not [string]::IsNullOrWhiteSpace($incomingLastSeen)) { $incomingLastSeen } else { (Get-Date).ToString('o') }
  $existing.username = $name
  if (-not $existing.gameStats) { $existing.gameStats = @{} }

  $Map[$name] = $existing
}

function Get-RoomsList {
  if (-not (Test-Path $sharedRoomsPath)) { return @() }
  try {
    $raw = Get-Content $sharedRoomsPath -Raw -Encoding UTF8
    if ([string]::IsNullOrWhiteSpace($raw)) { return @() }
    $obj = $raw | ConvertFrom-Json
    if ($obj -is [System.Array]) { return @($obj) }
  } catch {}
  return @()
}

function Save-RoomsList([object[]]$Rooms) {
  $json = @($Rooms) | ConvertTo-Json -Depth 8
  Set-Content -Path $sharedRoomsPath -Value $json -Encoding UTF8
}

function Join-Room([string]$RoomCode, [string]$Username) {
  $room = ([string]$RoomCode).Trim().ToUpperInvariant()
  $user = Sanitize-Username $Username
  if ([string]::IsNullOrWhiteSpace($room) -or [string]::IsNullOrWhiteSpace($user)) {
    return @{ ok = $false; error = 'room and username required' }
  }
  if ($room.Length -gt 12) { $room = $room.Substring(0, 12) }

  $rooms = Get-RoomsList
  $found = $null
  foreach ($r in $rooms) {
    if ([string]$r.code -eq $room) { $found = $r; break }
  }
  if (-not $found) {
    $found = [ordered]@{ code = $room; members = @(); scores = @{}; updatedAt = (Get-Date).ToString('o') }
    $rooms += $found
  }

  if (-not $found.scores) { $found.scores = @{} }

  $members = @($found.members)
  if ($members -notcontains $user) { $members += $user }
  if ($members.Count -gt 12) { $members = $members[($members.Count - 12)..($members.Count - 1)] }

  $found.members = $members
  $found.updatedAt = (Get-Date).ToString('o')
  Save-RoomsList -Rooms $rooms
  return @{ ok = $true; room = $found }
}

function Set-Room-Score([string]$RoomCode, [string]$GameId, [string]$Username, [int]$Score) {
  $room = ([string]$RoomCode).Trim().ToUpperInvariant()
  $game = ([string]$GameId).Trim().ToLowerInvariant()
  $user = Sanitize-Username $Username
  if ([string]::IsNullOrWhiteSpace($room) -or [string]::IsNullOrWhiteSpace($game) -or [string]::IsNullOrWhiteSpace($user)) {
    return @{ ok = $false; error = 'room, game, username required' }
  }

  $rooms = Get-RoomsList
  $found = $null
  foreach ($r in $rooms) {
    if ([string]$r.code -eq $room) { $found = $r; break }
  }
  if (-not $found) {
    return @{ ok = $false; error = 'room not found' }
  }

  if (-not $found.members -or (@($found.members) -notcontains $user)) {
    return @{ ok = $false; error = 'user not in room' }
  }

  if (-not $found.scores) { $found.scores = @{} }
  $gameScores = $found.scores.$game
  if (-not $gameScores) { $gameScores = @{} }
  $current = Get-SafeInt $gameScores.$user
  $next = [Math]::Max($current, [Math]::Max(0, $Score))
  $gameScores.$user = $next
  $found.scores.$game = $gameScores
  $found.updatedAt = (Get-Date).ToString('o')
  Save-RoomsList -Rooms $rooms
  return @{ ok = $true; best = $next }
}

function Get-Room-Scores([string]$RoomCode, [string]$GameId) {
  $room = ([string]$RoomCode).Trim().ToUpperInvariant()
  $game = ([string]$GameId).Trim().ToLowerInvariant()
  if ([string]::IsNullOrWhiteSpace($room) -or [string]::IsNullOrWhiteSpace($game)) {
    return @{ ok = $false; error = 'room and game required'; scores = @() }
  }

  $rooms = Get-RoomsList
  $found = $null
  foreach ($r in $rooms) {
    if ([string]$r.code -eq $room) { $found = $r; break }
  }
  if (-not $found) { return @{ ok = $false; error = 'room not found'; scores = @() } }
  if (-not $found.scores) { return @{ ok = $true; scores = @() } }

  $gameScores = $found.scores.$game
  if (-not $gameScores) { return @{ ok = $true; scores = @() } }

  $items = @()
  if ($gameScores.PSObject -and $gameScores.PSObject.Properties) {
    foreach ($p in $gameScores.PSObject.Properties) {
      $items += [ordered]@{ username = [string]$p.Name; score = Get-SafeInt $p.Value }
    }
  } elseif ($gameScores -is [System.Collections.IDictionary]) {
    foreach ($k in $gameScores.Keys) {
      $items += [ordered]@{ username = [string]$k; score = Get-SafeInt $gameScores[$k] }
    }
  }
  $items = @($items | Sort-Object -Property @{ Expression = { Get-SafeInt $_.score }; Descending = $true }, @{ Expression = { [string]$_.username }; Descending = $false })
  return @{ ok = $true; scores = $items }
}

function Get-WeeklyComp {
  if (-not (Test-Path $sharedWeeklyCompPath)) { return @{} }
  try {
    $raw = Get-Content $sharedWeeklyCompPath -Raw -Encoding UTF8
    if ([string]::IsNullOrWhiteSpace($raw)) { return @{} }
    $obj = $raw | ConvertFrom-Json
    if ($obj) {
      return @{
        title = [string]$obj.title
        theme = [string]$obj.theme
        deadline = [string]$obj.deadline
        host = [string]$obj.host
        updatedAt = [string]$obj.updatedAt
      }
    }
  } catch {}
  return @{}
}

function Save-WeeklyComp([hashtable]$Comp) {
  $json = $Comp | ConvertTo-Json -Depth 6
  Set-Content -Path $sharedWeeklyCompPath -Value $json -Encoding UTF8
}

function Get-ModerationState {
  if (-not (Test-Path $sharedModerationPath)) {
    return @{ ipBans = @(); userIps = @{}; userIpHistory = @{} }
  }
  try {
    $raw = Get-Content $sharedModerationPath -Raw -Encoding UTF8
    if ([string]::IsNullOrWhiteSpace($raw)) { return @{ ipBans = @(); userIps = @{}; userIpHistory = @{} } }
    $obj = $raw | ConvertFrom-Json
    $ipBans = @()
    $userIps = @{}
    $userIpHistory = @{}
    if ($obj.ipBans) { $ipBans = @($obj.ipBans) }
    if ($obj.userIps) {
      foreach ($p in $obj.userIps.PSObject.Properties) { $userIps[$p.Name] = [string]$p.Value }
    }
    if ($obj.userIpHistory) {
      foreach ($p in $obj.userIpHistory.PSObject.Properties) {
        $vals = @()
        foreach ($v in @($p.Value)) {
          $s = Normalize-Ip ([string]$v)
          if (-not [string]::IsNullOrWhiteSpace($s) -and $vals -notcontains $s) { $vals += $s }
        }
        $userIpHistory[$p.Name] = $vals
      }
    }
    return @{ ipBans = $ipBans; userIps = $userIps; userIpHistory = $userIpHistory }
  } catch {
    return @{ ipBans = @(); userIps = @{}; userIpHistory = @{} }
  }
}

function Save-ModerationState([hashtable]$State) {
  $json = $State | ConvertTo-Json -Depth 12
  Set-Content -Path $sharedModerationPath -Value $json -Encoding UTF8
}

function Record-UserIp([string]$Username, [string]$Ip) {
  $u = Sanitize-Username $Username
  $nIp = Normalize-Ip $Ip
  if ([string]::IsNullOrWhiteSpace($u) -or [string]::IsNullOrWhiteSpace($nIp)) { return }
  $state = Get-ModerationState
  $state.userIps[$u] = $nIp
  if (-not $state.userIpHistory) { $state.userIpHistory = @{} }
  $hist = @()
  if ($state.userIpHistory.ContainsKey($u)) { $hist = @($state.userIpHistory[$u]) }
  if ($hist -notcontains $nIp) { $hist += $nIp }
  if ($hist.Count -gt 12) { $hist = $hist[($hist.Count - 12)..($hist.Count - 1)] }
  $state.userIpHistory[$u] = $hist
  Save-ModerationState -State $state
}

function Is-Moderator([string]$Username, [hashtable]$LeaderboardMap) {
  $u = Sanitize-Username $Username
  if ([string]::IsNullOrWhiteSpace($u)) { return $false }
  if ($u -ieq $ownerName) { return $true }
  $acc = $LeaderboardMap[$u]
  if (-not $acc) { return $false }
  $role = [string]$acc.role
  return $role -ieq 'mod' -or $role -ieq 'admin' -or $role -ieq 'owner'
}

function Is-Staff([string]$Username, [hashtable]$LeaderboardMap) {
  $u = Sanitize-Username $Username
  if ([string]::IsNullOrWhiteSpace($u)) { return $false }
  if ($u -ieq $ownerName) { return $true }
  $acc = $LeaderboardMap[$u]
  if (-not $acc) { return $false }
  $role = [string]$acc.role
  return $role -ieq 'helper' -or $role -ieq 'mod' -or $role -ieq 'admin' -or $role -ieq 'owner'
}

function Is-BannedIp([string]$Ip) {
  $active = Get-ActiveIpBan -Ip $Ip
  return $null -ne $active
}

function Purge-ExpiredIpBans([hashtable]$State) {
  if (-not $State) { return $false }
  $changed = $false
  $now = Get-Date
  $next = @()
  foreach ($b in @($State.ipBans)) {
    $keep = $true
    $untilRaw = [string]$b.expiresAt
    if (-not [string]::IsNullOrWhiteSpace($untilRaw)) {
      try {
        $until = [DateTime]::Parse($untilRaw)
        if ($until -le $now) { $keep = $false }
      } catch {}
    }
    if ($keep) {
      $next += $b
    } else {
      $changed = $true
    }
  }
  if ($changed) { $State.ipBans = $next }
  return $changed
}

function Get-ActiveIpBan([string]$Ip) {
  $nIp = Normalize-Ip $Ip
  $state = Get-ModerationState
  $expiredChanged = Purge-ExpiredIpBans -State $state
  if ($expiredChanged) { Save-ModerationState -State $state }
  foreach ($b in @($state.ipBans)) {
    if ((Normalize-Ip ([string]$b.ip)) -eq $nIp) { return $b }
  }
  return $null
}

function Resolve-TargetIp([string]$Target) {
  $t = ([string]$Target).Trim()
  if ([string]::IsNullOrWhiteSpace($t)) { return '' }
  if ($t -match '^[0-9a-fA-F:\.]+$') { return (Normalize-Ip $t) }
  $u = Sanitize-Username $t
  if ([string]::IsNullOrWhiteSpace($u)) { return '' }
  $state = Get-ModerationState
  if ($state.userIps.ContainsKey($u)) { return (Normalize-Ip ([string]$state.userIps[$u])) }
  return ''
}

function Add-IpBan([string]$Ip, [string]$By, [string]$Reason, [int]$Hours) {
  $nIp = Normalize-Ip $Ip
  $cleanReason = ([string]$Reason).Trim()
  $hrs = [Math]::Max(0, [int]$Hours)
  if ([string]::IsNullOrWhiteSpace($nIp)) { return @{ ok = $false; error = 'target ip not found' } }
  if ([string]::IsNullOrWhiteSpace($cleanReason)) { return @{ ok = $false; error = 'reason required' } }
  if ($hrs -le 0) { return @{ ok = $false; error = 'hours required' } }

  $state = Get-ModerationState
  $expiredChanged = Purge-ExpiredIpBans -State $state
  $until = (Get-Date).AddHours($hrs).ToString('o')

  foreach ($b in @($state.ipBans)) {
    if ((Normalize-Ip ([string]$b.ip)) -eq $nIp) {
      $b.bannedBy = (Sanitize-Username $By)
      $b.reason = $cleanReason
      $b.bannedAt = (Get-Date).ToString('o')
      $b.expiresAt = $until
      Save-ModerationState -State $state
      return @{ ok = $true; ip = $nIp; until = $until }
    }
  }

  $entry = [ordered]@{
    ip = $nIp
    bannedBy = (Sanitize-Username $By)
    reason = $cleanReason
    bannedAt = (Get-Date).ToString('o')
    expiresAt = $until
  }
  $state.ipBans = @($state.ipBans) + @($entry)
  if ($expiredChanged) { $state.ipBans = @($state.ipBans) }
  Save-ModerationState -State $state
  return @{ ok = $true; ip = $nIp; until = $until }
}

function Remove-IpBan([string]$Ip) {
  $nIp = Normalize-Ip $Ip
  $state = Get-ModerationState
  $next = @()
  foreach ($b in @($state.ipBans)) {
    if ((Normalize-Ip ([string]$b.ip)) -ne $nIp) { $next += $b }
  }
  $state.ipBans = $next
  Save-ModerationState -State $state
}

function Get-ContentType([string]$Path) {
  $ext = [IO.Path]::GetExtension($Path).ToLowerInvariant()
  switch ($ext) {
    '.html' { return 'text/html; charset=utf-8' }
    '.css'  { return 'text/css; charset=utf-8' }
    '.js'   { return 'application/javascript; charset=utf-8' }
    '.json' { return 'application/json; charset=utf-8' }
    '.png'  { return 'image/png' }
    '.jpg'  { return 'image/jpeg' }
    '.jpeg' { return 'image/jpeg' }
    '.gif'  { return 'image/gif' }
    '.webp' { return 'image/webp' }
    '.svg'  { return 'image/svg+xml' }
    '.ico'  { return 'image/x-icon' }
    default { return 'application/octet-stream' }
  }
}

function Write-HttpResponse(
  [System.IO.Stream]$Stream,
  [int]$StatusCode,
  [string]$StatusText,
  [string]$ContentType,
  [byte[]]$Body,
  [bool]$HeadOnly
) {
  $header = "HTTP/1.1 $StatusCode $StatusText`r`n" +
            "Content-Type: $ContentType`r`n" +
            "Content-Length: $($Body.Length)`r`n" +
            "Connection: close`r`n`r`n"
  $headerBytes = [Text.Encoding]::ASCII.GetBytes($header)
  try {
    $Stream.Write($headerBytes, 0, $headerBytes.Length)
    if (-not $HeadOnly -and $Body.Length -gt 0) { $Stream.Write($Body, 0, $Body.Length) }
  } catch {}
}

$bindIp = if ($LocalOnly) { [Net.IPAddress]::Parse('127.0.0.1') } else { [Net.IPAddress]::Any }
$listener = [Net.Sockets.TcpListener]::new($bindIp, $Port)

try { $listener.Start() } catch { Write-Host "Failed to start server on port $Port."; throw }

Write-Host "Serving $Root"
Write-Host "Local URL: http://localhost:$Port/"
if (-not $LocalOnly) {
  Write-Host "LAN URL format: http://<your-ip>:$Port/"
  Write-Host "Shared LAN leaderboard API is enabled."
}
Write-Host "Press Ctrl+C to stop."

while ($true) {
  $client = $listener.AcceptTcpClient()
  try {
    try {
      $client.ReceiveTimeout = 7000
      $client.SendTimeout = 7000
      $stream = $client.GetStream()
      $stream.ReadTimeout = 7000
      $stream.WriteTimeout = 7000
      $reader = [IO.StreamReader]::new($stream, [Text.Encoding]::ASCII, $false, 2048, $true)

      $remoteIp = '127.0.0.1'
      try { $remoteIp = Normalize-Ip ([string]$client.Client.RemoteEndPoint.Address) } catch {}

      try { $requestLine = $reader.ReadLine() } catch { continue }
      if ([string]::IsNullOrWhiteSpace($requestLine)) { continue }

      while ($true) {
        $line = $reader.ReadLine()
        if ([string]::IsNullOrEmpty($line)) { break }
      }

      $parts = $requestLine -split ' '
      if ($parts.Length -lt 2) {
        $body = [Text.Encoding]::UTF8.GetBytes('Bad Request')
        Write-HttpResponse -Stream $stream -StatusCode 400 -StatusText 'Bad Request' -ContentType 'text/plain; charset=utf-8' -Body $body -HeadOnly $false
        continue
      }

      $method = $parts[0].ToUpperInvariant()
      $rawPath = $parts[1]
      $headOnly = $method -eq 'HEAD'
      if ($method -ne 'GET' -and $method -ne 'HEAD') {
        $body = [Text.Encoding]::UTF8.GetBytes('Method Not Allowed')
        Write-HttpResponse -Stream $stream -StatusCode 405 -StatusText 'Method Not Allowed' -ContentType 'text/plain; charset=utf-8' -Body $body -HeadOnly $headOnly
        continue
      }

      $pathNoQuery = ($rawPath -split '\?')[0]
      $banInfo = Get-ActiveIpBan -Ip $remoteIp
      if (($null -ne $banInfo) -and $pathNoQuery -ne '/api/mod-state' -and $pathNoQuery -ne '/api/unban-ip') {
        $blocked = @{
          ok = $false
          error = 'ip banned'
          reason = [string]$banInfo.reason
          until = [string]$banInfo.expiresAt
        }
        $body = [Text.Encoding]::UTF8.GetBytes(($blocked | ConvertTo-Json -Depth 6))
        Write-HttpResponse -Stream $stream -StatusCode 403 -StatusText 'Forbidden' -ContentType 'application/json; charset=utf-8' -Body $body -HeadOnly $headOnly
        continue
      }

      if ($pathNoQuery -eq '/api/accounts') {
        $map = Get-SharedLeaderboardMap
        $accounts = @($map.Values) | Sort-Object -Property @{Expression = { Get-SafeInt $_.rankPoints }; Descending = $true }, @{Expression = { Get-SafeInt $_.totalScore }; Descending = $true }
        $json = @{ accounts = $accounts } | ConvertTo-Json -Depth 12
        $body = [Text.Encoding]::UTF8.GetBytes($json)
        Write-HttpResponse -Stream $stream -StatusCode 200 -StatusText 'OK' -ContentType 'application/json; charset=utf-8' -Body $body -HeadOnly $headOnly
        continue
      }

      if ($pathNoQuery -eq '/api/upsert') {
        $uri = [Uri]("http://localhost$rawPath")
        $q = Parse-QueryString $uri.Query
        $username = [string]$q['username']
        if ([string]::IsNullOrWhiteSpace((Sanitize-Username $username))) {
          $body = [Text.Encoding]::UTF8.GetBytes('{"ok":false,"error":"username required"}')
          Write-HttpResponse -Stream $stream -StatusCode 400 -StatusText 'Bad Request' -ContentType 'application/json; charset=utf-8' -Body $body -HeadOnly $headOnly
          continue
        }
        $map = Get-SharedLeaderboardMap
        Merge-SharedAccount -Map $map -Username $username -Q $q
        Save-SharedLeaderboardMap -Map $map
        Record-UserIp -Username $username -Ip $remoteIp
        $body = [Text.Encoding]::UTF8.GetBytes('{"ok":true}')
        Write-HttpResponse -Stream $stream -StatusCode 200 -StatusText 'OK' -ContentType 'application/json; charset=utf-8' -Body $body -HeadOnly $headOnly
        continue
      }

      if ($pathNoQuery -eq '/api/rooms') {
        $rooms = Get-RoomsList
        $json = @{ rooms = $rooms } | ConvertTo-Json -Depth 8
        $body = [Text.Encoding]::UTF8.GetBytes($json)
        Write-HttpResponse -Stream $stream -StatusCode 200 -StatusText 'OK' -ContentType 'application/json; charset=utf-8' -Body $body -HeadOnly $headOnly
        continue
      }

      if ($pathNoQuery -eq '/api/room-join') {
        $uri = [Uri]("http://localhost$rawPath")
        $q = Parse-QueryString $uri.Query
        $username = [string]$q['username']
        $result = Join-Room -RoomCode ([string]$q['room']) -Username $username
        if (-not $result.ok) {
          $body = [Text.Encoding]::UTF8.GetBytes((@{ ok = $false; error = $result.error } | ConvertTo-Json -Depth 5))
          Write-HttpResponse -Stream $stream -StatusCode 400 -StatusText 'Bad Request' -ContentType 'application/json; charset=utf-8' -Body $body -HeadOnly $headOnly
          continue
        }
        Record-UserIp -Username $username -Ip $remoteIp
        $body = [Text.Encoding]::UTF8.GetBytes(($result | ConvertTo-Json -Depth 8))
        Write-HttpResponse -Stream $stream -StatusCode 200 -StatusText 'OK' -ContentType 'application/json; charset=utf-8' -Body $body -HeadOnly $headOnly
        continue
      }

      if ($pathNoQuery -eq '/api/room-score') {
        $uri = [Uri]("http://localhost$rawPath")
        $q = Parse-QueryString $uri.Query
        $result = Set-Room-Score -RoomCode ([string]$q['room']) -GameId ([string]$q['game']) -Username ([string]$q['username']) -Score (Get-SafeInt $q['score'])
        if (-not $result.ok) {
          $body = [Text.Encoding]::UTF8.GetBytes(($result | ConvertTo-Json -Depth 8))
          Write-HttpResponse -Stream $stream -StatusCode 400 -StatusText 'Bad Request' -ContentType 'application/json; charset=utf-8' -Body $body -HeadOnly $headOnly
          continue
        }
        $body = [Text.Encoding]::UTF8.GetBytes(($result | ConvertTo-Json -Depth 8))
        Write-HttpResponse -Stream $stream -StatusCode 200 -StatusText 'OK' -ContentType 'application/json; charset=utf-8' -Body $body -HeadOnly $headOnly
        continue
      }

      if ($pathNoQuery -eq '/api/room-scores') {
        $uri = [Uri]("http://localhost$rawPath")
        $q = Parse-QueryString $uri.Query
        $result = Get-Room-Scores -RoomCode ([string]$q['room']) -GameId ([string]$q['game'])
        if (-not $result.ok) {
          $body = [Text.Encoding]::UTF8.GetBytes(($result | ConvertTo-Json -Depth 8))
          Write-HttpResponse -Stream $stream -StatusCode 400 -StatusText 'Bad Request' -ContentType 'application/json; charset=utf-8' -Body $body -HeadOnly $headOnly
          continue
        }
        $body = [Text.Encoding]::UTF8.GetBytes(($result | ConvertTo-Json -Depth 8))
        Write-HttpResponse -Stream $stream -StatusCode 200 -StatusText 'OK' -ContentType 'application/json; charset=utf-8' -Body $body -HeadOnly $headOnly
        continue
      }

      if ($pathNoQuery -eq '/api/weekly-comp') {
        $comp = Get-WeeklyComp
        $json = @{ competition = $comp } | ConvertTo-Json -Depth 8
        $body = [Text.Encoding]::UTF8.GetBytes($json)
        Write-HttpResponse -Stream $stream -StatusCode 200 -StatusText 'OK' -ContentType 'application/json; charset=utf-8' -Body $body -HeadOnly $headOnly
        continue
      }

      if ($pathNoQuery -eq '/api/weekly-comp-set') {
        $uri = [Uri]("http://localhost$rawPath")
        $q = Parse-QueryString $uri.Query
        $u = [string]$q['username']
        $p = [string]$q['password']
        if ($u -ne $ownerName -or $p -ne $ownerPassword) {
          $body = [Text.Encoding]::UTF8.GetBytes('{"ok":false,"error":"owner auth failed"}')
          Write-HttpResponse -Stream $stream -StatusCode 403 -StatusText 'Forbidden' -ContentType 'application/json; charset=utf-8' -Body $body -HeadOnly $headOnly
          continue
        }

        $title = ([string]$q['title']).Trim()
        $theme = ([string]$q['theme']).Trim()
        $deadline = ([string]$q['deadline']).Trim()
        if ([string]::IsNullOrWhiteSpace($title)) { $title = 'Weekly Drawing Competition' }
        if ($title.Length -gt 80) { $title = $title.Substring(0, 80) }
        if ($theme.Length -gt 80) { $theme = $theme.Substring(0, 80) }
        if ($deadline.Length -gt 40) { $deadline = $deadline.Substring(0, 40) }

        Save-WeeklyComp -Comp @{
          title = $title
          theme = $theme
          deadline = $deadline
          host = $u
          updatedAt = (Get-Date).ToString('o')
        }
        $body = [Text.Encoding]::UTF8.GetBytes('{"ok":true}')
        Write-HttpResponse -Stream $stream -StatusCode 200 -StatusText 'OK' -ContentType 'application/json; charset=utf-8' -Body $body -HeadOnly $headOnly
        continue
      }

      if ($pathNoQuery -eq '/api/mod-state') {
        $uri = [Uri]("http://localhost$rawPath")
        $q = Parse-QueryString $uri.Query
        $requester = [string]$q['username']
        $map = Get-SharedLeaderboardMap
        if (-not (Is-Staff -Username $requester -LeaderboardMap $map)) {
          $body = [Text.Encoding]::UTF8.GetBytes('{"ok":false,"error":"staff role required"}')
          Write-HttpResponse -Stream $stream -StatusCode 403 -StatusText 'Forbidden' -ContentType 'application/json; charset=utf-8' -Body $body -HeadOnly $headOnly
          continue
        }
        $state = Get-ModerationState
        if (Purge-ExpiredIpBans -State $state) { Save-ModerationState -State $state }
        $json = @{ ok = $true; ipBans = @($state.ipBans); userIps = $state.userIps; userIpHistory = $state.userIpHistory } | ConvertTo-Json -Depth 12
        $body = [Text.Encoding]::UTF8.GetBytes($json)
        Write-HttpResponse -Stream $stream -StatusCode 200 -StatusText 'OK' -ContentType 'application/json; charset=utf-8' -Body $body -HeadOnly $headOnly
        continue
      }

      if ($pathNoQuery -eq '/api/ban-ip') {
        $uri = [Uri]("http://localhost$rawPath")
        $q = Parse-QueryString $uri.Query
        $requester = [string]$q['username']
        $target = [string]$q['target']
        $reason = [string]$q['reason']
        $hours = Get-SafeInt $q['hours']
        $password = [string]$q['password']
        $map = Get-SharedLeaderboardMap
        if (-not (Is-Moderator -Username $requester -LeaderboardMap $map)) {
          $body = [Text.Encoding]::UTF8.GetBytes('{"ok":false,"error":"moderator required"}')
          Write-HttpResponse -Stream $stream -StatusCode 403 -StatusText 'Forbidden' -ContentType 'application/json; charset=utf-8' -Body $body -HeadOnly $headOnly
          continue
        }
        if ((Sanitize-Username $requester) -ieq $ownerName -and $password -ne $ownerPassword) {
          $body = [Text.Encoding]::UTF8.GetBytes('{"ok":false,"error":"owner password required"}')
          Write-HttpResponse -Stream $stream -StatusCode 403 -StatusText 'Forbidden' -ContentType 'application/json; charset=utf-8' -Body $body -HeadOnly $headOnly
          continue
        }
        $targetIp = Resolve-TargetIp -Target $target
        if ([string]::IsNullOrWhiteSpace($targetIp)) {
          $body = [Text.Encoding]::UTF8.GetBytes('{"ok":false,"error":"target ip not found"}')
          Write-HttpResponse -Stream $stream -StatusCode 400 -StatusText 'Bad Request' -ContentType 'application/json; charset=utf-8' -Body $body -HeadOnly $headOnly
          continue
        }
        $banResult = Add-IpBan -Ip $targetIp -By $requester -Reason $reason -Hours $hours
        if (-not $banResult.ok) {
          $body = [Text.Encoding]::UTF8.GetBytes(($banResult | ConvertTo-Json -Depth 6))
          Write-HttpResponse -Stream $stream -StatusCode 400 -StatusText 'Bad Request' -ContentType 'application/json; charset=utf-8' -Body $body -HeadOnly $headOnly
          continue
        }
        $body = [Text.Encoding]::UTF8.GetBytes(($banResult | ConvertTo-Json -Depth 6))
        Write-HttpResponse -Stream $stream -StatusCode 200 -StatusText 'OK' -ContentType 'application/json; charset=utf-8' -Body $body -HeadOnly $headOnly
        continue
      }

      if ($pathNoQuery -eq '/api/unban-ip') {
        $uri = [Uri]("http://localhost$rawPath")
        $q = Parse-QueryString $uri.Query
        $requester = [string]$q['username']
        $ip = [string]$q['ip']
        $password = [string]$q['password']
        $map = Get-SharedLeaderboardMap
        if (-not (Is-Moderator -Username $requester -LeaderboardMap $map)) {
          $body = [Text.Encoding]::UTF8.GetBytes('{"ok":false,"error":"moderator required"}')
          Write-HttpResponse -Stream $stream -StatusCode 403 -StatusText 'Forbidden' -ContentType 'application/json; charset=utf-8' -Body $body -HeadOnly $headOnly
          continue
        }
        if ((Sanitize-Username $requester) -ieq $ownerName -and $password -ne $ownerPassword) {
          $body = [Text.Encoding]::UTF8.GetBytes('{"ok":false,"error":"owner password required"}')
          Write-HttpResponse -Stream $stream -StatusCode 403 -StatusText 'Forbidden' -ContentType 'application/json; charset=utf-8' -Body $body -HeadOnly $headOnly
          continue
        }
        Remove-IpBan -Ip $ip
        $body = [Text.Encoding]::UTF8.GetBytes('{"ok":true}')
        Write-HttpResponse -Stream $stream -StatusCode 200 -StatusText 'OK' -ContentType 'application/json; charset=utf-8' -Body $body -HeadOnly $headOnly
        continue
      }

      if ($pathNoQuery -eq '/api/set-admin') {
        $uri = [Uri]("http://localhost$rawPath")
        $q = Parse-QueryString $uri.Query
        $u = Sanitize-Username ([string]$q['username'])
        $p = [string]$q['password']
        $target = Sanitize-Username ([string]$q['target'])
        $role = ([string]$q['role']).ToLowerInvariant()
        if ($u -ne $ownerName -or $p -ne $ownerPassword) {
          $body = [Text.Encoding]::UTF8.GetBytes('{"ok":false,"error":"owner auth failed"}')
          Write-HttpResponse -Stream $stream -StatusCode 403 -StatusText 'Forbidden' -ContentType 'application/json; charset=utf-8' -Body $body -HeadOnly $headOnly
          continue
        }
        if ([string]::IsNullOrWhiteSpace($target)) {
          $body = [Text.Encoding]::UTF8.GetBytes('{"ok":false,"error":"target required"}')
          Write-HttpResponse -Stream $stream -StatusCode 400 -StatusText 'Bad Request' -ContentType 'application/json; charset=utf-8' -Body $body -HeadOnly $headOnly
          continue
        }
        if ($target -ieq $ownerName) { $role = 'owner' }
        if ($target -ine $ownerName -and $role -eq 'owner') {
          $body = [Text.Encoding]::UTF8.GetBytes('{"ok":false,"error":"only Bob123meep can be owner"}')
          Write-HttpResponse -Stream $stream -StatusCode 400 -StatusText 'Bad Request' -ContentType 'application/json; charset=utf-8' -Body $body -HeadOnly $headOnly
          continue
        }
        if ($role -notin @('player','helper','mod','admin','owner')) { $role = 'player' }

        $map = Get-SharedLeaderboardMap
        if (-not $map[$target]) {
          $map[$target] = [ordered]@{
            username = $target
            createdAt = (Get-Date).ToString('o')
            lastSeen = (Get-Date).ToString('o')
            totalPlays = 0
            totalScore = 0
            bestScore = 0
            rankPoints = 0
            level = 1
            credits = 0
            tokens = 0
            rankName = 'Dirt'
            role = $role
            gameStats = @{}
          }
        }
        $map[$target].role = $role
        $map[$target].lastSeen = (Get-Date).ToString('o')
        Save-SharedLeaderboardMap -Map $map
        $body = [Text.Encoding]::UTF8.GetBytes('{"ok":true}')
        Write-HttpResponse -Stream $stream -StatusCode 200 -StatusText 'OK' -ContentType 'application/json; charset=utf-8' -Body $body -HeadOnly $headOnly
        continue
      }

      if ($pathNoQuery -eq '/api/reset-leaderboard') {
        $uri = [Uri]("http://localhost$rawPath")
        $q = Parse-QueryString $uri.Query
        $u = Sanitize-Username ([string]$q['username'])
        $p = [string]$q['password']
        if ($u -ne $ownerName -or $p -ne $ownerPassword) {
          $body = [Text.Encoding]::UTF8.GetBytes('{"ok":false,"error":"owner auth failed"}')
          Write-HttpResponse -Stream $stream -StatusCode 403 -StatusText 'Forbidden' -ContentType 'application/json; charset=utf-8' -Body $body -HeadOnly $headOnly
          continue
        }

        $fresh = @{}
        $fresh[$ownerName] = New-EmptySharedAccount -Username $ownerName
        $fresh[$ownerName].role = 'owner'
        Save-SharedLeaderboardMap -Map $fresh
        $body = [Text.Encoding]::UTF8.GetBytes('{"ok":true}')
        Write-HttpResponse -Stream $stream -StatusCode 200 -StatusText 'OK' -ContentType 'application/json; charset=utf-8' -Body $body -HeadOnly $headOnly
        continue
      }

      $decodedPath = [Uri]::UnescapeDataString($pathNoQuery).TrimStart('/')
      if ([string]::IsNullOrWhiteSpace($decodedPath)) { $decodedPath = 'index.html' }

      $safePath = $decodedPath -replace '/', [IO.Path]::DirectorySeparatorChar
      $candidatePath = [IO.Path]::GetFullPath((Join-Path $Root $safePath))
      $rootPath = [IO.Path]::GetFullPath($Root)

      if (-not $candidatePath.StartsWith($rootPath, [StringComparison]::OrdinalIgnoreCase)) {
        $body = [Text.Encoding]::UTF8.GetBytes('403 Forbidden')
        Write-HttpResponse -Stream $stream -StatusCode 403 -StatusText 'Forbidden' -ContentType 'text/plain; charset=utf-8' -Body $body -HeadOnly $headOnly
        continue
      }

      if ((Test-Path $candidatePath) -and (Get-Item $candidatePath).PSIsContainer) {
        $candidatePath = Join-Path $candidatePath 'index.html'
      }

      if ((Test-Path $candidatePath) -and -not (Get-Item $candidatePath).PSIsContainer) {
        $bytes = [IO.File]::ReadAllBytes($candidatePath)
        $contentType = Get-ContentType $candidatePath
        Write-HttpResponse -Stream $stream -StatusCode 200 -StatusText 'OK' -ContentType $contentType -Body $bytes -HeadOnly $headOnly
      } else {
        $body = [Text.Encoding]::UTF8.GetBytes('404 Not Found')
        Write-HttpResponse -Stream $stream -StatusCode 404 -StatusText 'Not Found' -ContentType 'text/plain; charset=utf-8' -Body $body -HeadOnly $headOnly
      }

      try { $stream.Flush() } catch {}
    } catch {}
  } finally {
    $client.Close()
  }
}
