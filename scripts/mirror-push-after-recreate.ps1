#Requires -Version 5.1
# UTF-8: run in PowerShell 7+ or set console to UTF-8 for CJK comments.
<#
  After you delete the old repo on GitHub and create a new EMPTY repo with the same name, run this to mirror-push.
  Usage:
    .\scripts\mirror-push-after-recreate.ps1
    .\scripts\mirror-push-after-recreate.ps1 -SkipPrompt
    .\scripts\mirror-push-after-recreate.ps1 -RemoteUrl "https://github.com/violet-summer/life-blog.git"
#>
param(
    [string] $BarePath = "",
    [string] $RemoteUrl = "https://github.com/violet-summer/life-blog.git",
    [switch] $SkipPrompt
)

$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

if (-not $BarePath) {
    $parent = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
    $BarePath = Join-Path $parent "life-blog-bare.git"
}

if (-not (Test-Path $BarePath)) {
    Write-Host "Bare repo not found: $BarePath" -ForegroundColor Red
    Write-Host "Create it first: git clone --bare https://github.com/violet-summer/life-blog.git D:\CODE\life-blog-bare.git"
    exit 1
}

Write-Host "Will run: git -C `"$BarePath`" push --mirror `"$RemoteUrl`"" -ForegroundColor Yellow
if (-not $SkipPrompt) {
    Write-Host "Only continue AFTER: old repo deleted + new EMPTY repo created (same name). Press Enter to push, Ctrl+C to cancel."
    Read-Host | Out-Null
}

& git -C $BarePath push --mirror $RemoteUrl
$exit = $LASTEXITCODE
if ($exit -ne 0) {
    Write-Host ""
    Write-Host "git push failed (exit $exit). Common causes:" -ForegroundColor Red
    Write-Host "  - HTTPS: sign in or use a Personal Access Token (repo scope) as password."
    Write-Host "  - New repo must be empty (no README, no license)."
    Write-Host "  - Repo URL / name must match (e.g. violet-summer/life-blog)."
    Write-Host "  - Or use SSH: -RemoteUrl git@github.com:violet-summer/life-blog.git"
    exit $exit
}

Write-Host "Mirror push done." -ForegroundColor Green
