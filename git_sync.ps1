# git_sync.ps1

# 1. 변경 사항 스테이징 및 커밋
git add .
$commitMsg = "Update: " + (Get-Date -Format "yyyy-MM-dd HH:mm:ss")
git commit -m $commitMsg

# 2. 원격 저장소 최신화 (pull)
Write-Host "Pulling from remote..." -ForegroundColor Cyan
git pull origin main

# 3. 원격 저장소 업로드 (push)
Write-Host "Pushing to remote..." -ForegroundColor Green
git push origin main

Write-Host "Git 작업 완료!" -ForegroundColor Yellow