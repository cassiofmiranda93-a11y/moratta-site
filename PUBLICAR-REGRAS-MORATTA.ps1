$ErrorActionPreference = "Stop"
Set-Location (Split-Path -Parent $MyInvocation.MyCommand.Path)

$projectId = "atlas-ai-83f0d"
if (-not (Get-Command firebase -ErrorAction SilentlyContinue)) {
    Write-Host "Instalando Firebase CLI..." -ForegroundColor Cyan
    npm install -g firebase-tools
}

Write-Host "Será aberta a autenticação do Firebase." -ForegroundColor Cyan
firebase login
firebase deploy --only firestore:rules,storage --project $projectId

Write-Host "Regras publicadas no projeto $projectId." -ForegroundColor Green
