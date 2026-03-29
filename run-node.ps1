$fnm = "$env:LOCALAPPDATA\Microsoft\WinGet\Packages\Schniz.fnm_Microsoft.Winget.Source_8wekyb3d8bbwe\fnm.exe"
$fnmEnv = & $fnm env --use-on-cd 2>$null
$fnmEnv | Where-Object { $_ -match '^\$env:' } | ForEach-Object { Invoke-Expression $_ }
$nodeExe = Join-Path $env:FNM_MULTISHELL_PATH "node.exe"
& $nodeExe $args
