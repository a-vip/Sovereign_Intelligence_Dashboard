param (
    [Parameter(Mandatory=$true, Position=0)]
    [string]$Prompt
)

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$WrapperScript = Join-Path $ScriptDir "deepseekWrapper.js"

node $WrapperScript "$Prompt"
