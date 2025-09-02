@echo off
echo Updating codeba::ccessfully updated codebase!
    echo.
    echo Latest commit:
    git log -1 --oneline
    
    :: Clear Microsoft Edge cache
    echo.
    echo Clearing Microsoft Edge cache...
    
    :: Kill Edge processes first
    taskkill /F /IM msedge.exe >nul 2>&1
    
    :: Clear Edge cache directories
    if exist "%LOCALAPPDATA%\Microsoft\Edge\User Data\Default\Cache" (
        rmdir /s /q "%LOCALAPPDATA%\Microsoft\Edge\User Data\Default\Cache" >nul 2>&1
    )
    if exist "%LOCALAPPDATA%\Microsoft\Edge\User Data\Default\Code Cache" (
        rmdir /s /q "%LOCALAPPDATA%\Microsoft\Edge\User Data\Default\Code Cache" >nul 2>&1
    )
    if exist "%LOCALAPPDATA%\Microsoft\Edge\User Data\Default\GPUCache" (
        rmdir /s /q "%LOCALAPPDATA%\Microsoft\Edge\User Data\Default\GPUCache" >nul 2>&1
    )
    if exist "%LOCALAPPDATA%\Microsoft\Edge\User Data\ShaderCache" (
        rmdir /s /q "%LOCALAPPDATA%\Microsoft\Edge\User Data\ShaderCache" >nul 2>&1
    )
    
    echo Microsoft Edge cache cleared successfully!
) else (
    echo.
    echo Error: Failed to pull changes. Please check for merge conflicts or network issues.
)

echo.
pause

:: Check if we're in a git repository
git status >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: This directory is not a git repository.
    echo Please navigate to your git repository and try again.
    pause
    exit /b 1
)

:: Display current branch
echo Current branch:
git branch --show-current

:: Fetch latest changes
echo.
echo Fetching latest changes from remote...
git fetch

:: Pull changes
echo.
echo Pulling latest changes...
git pull

:: Check if pull was successful
if %errorlevel% equ 0 (
    echo.
    echo Successfully updated codebase!
    echo.
    echo Latest commit:
    git log -1 --oneline
) else (
    echo.
    echo Error: Failed to pull changes. Please check for merge conflicts or network issues.
)

echo.
pause
