param (
    [Parameter(Mandatory=$false, Position=0)]
    [ValidateSet("commit", "brief")]
    [string]$Mode = "commit"
)

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$GitScript = Join-Path $ScriptDir "gitDeepSeek.js"

node $GitScript $Mode
