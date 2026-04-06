#Requires -Version 5.1
<#
  Replace local main with ONE commit (current tree, .gitignore respected). Old main history is removed locally.
  Then you push: git push --force origin main

  Usage (from repo root):
    .\scripts\push-main-squash-fresh-history.ps1
    .\scripts\push-main-squash-fresh-history.ps1 -CommitMessage "Initial import"
    .\scripts\push-main-squash-fresh-history.ps1 -SkipPrompt
#>
param(
    [string] $CommitMessage = "chore: snapshot current main (history cleared locally)",
    [switch] $SkipPrompt
)

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path $PSScriptRoot -Parent
Set-Location $repoRoot

if (-not $SkipPrompt) {
    Write-Host "This DELETES all local commit history on main and replaces it with ONE new commit." -ForegroundColor Yellow
    Write-Host "Then run: git push --force origin main" -ForegroundColor Yellow
    Write-Host "Type YES to continue:"
    if ((Read-Host) -ne "YES") { Write-Host "Aborted."; exit 1 }
}

$orphan = "orphan-main-temp"

git checkout --orphan $orphan
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

git add -A
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

git commit -m $CommitMessage
if ($LASTEXITCODE -ne 0) {
    Write-Host "Commit failed or nothing to commit." -ForegroundColor Red
    exit 1
}

if (git branch --list main) {
    git branch -D main
}
git branch -m main

Write-Host "Done. Local main = single commit." -ForegroundColor Green
Write-Host "Push (overwrites remote main history):" -ForegroundColor Cyan
Write-Host "  git push --force origin main" -ForegroundColor White
Write-Host "Empty new repo on GitHub may use: git push -u origin main" -ForegroundColor Gray
