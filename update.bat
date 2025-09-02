@echo off
echo Updating codebase...
echo.

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
    
    :: Clear Microsoft Edge cache
    echo.
    echo Clearing Microsoft Edge cache...
    
    :: Clear DawnWebGPUCache
    if exist "%LOCALAPPDATA%\Microsoft\Edge\User Data\Default\DawnWebGPUCache" (
        echo Clearing DawnWebGPUCache...
        rmdir /s /q "%LOCALAPPDATA%\Microsoft\Edge\User Data\Default\DawnWebGPUCache" 2>nul
        if %errorlevel% equ 0 (
            echo DawnWebGPUCache cleared successfully.
        ) else (
            echo Warning: Could not clear DawnWebGPUCache. It may be in use.
        )
    ) else (
        echo DawnWebGPUCache not found.
    )
    
    :: Clear DawnGraphiteCache
    if exist "%LOCALAPPDATA%\Microsoft\Edge\User Data\Default\DawnGraphiteCache" (
        echo Clearing DawnGraphiteCache...
        rmdir /s /q "%LOCALAPPDATA%\Microsoft\Edge\User Data\Default\DawnGraphiteCache" 2>nul
        if %errorlevel% equ 0 (
            echo DawnGraphiteCache cleared successfully.
        ) else (
            echo Warning: Could not clear DawnGraphiteCache. It may be in use.
        )
    ) else (
        echo DawnGraphiteCache not found.
    )
    
    :: Clear general browser cache
    if exist "%LOCALAPPDATA%\Microsoft\Edge\User Data\Default\Cache" (
        echo Clearing general Edge cache...
        rmdir /s /q "%LOCALAPPDATA%\Microsoft\Edge\User Data\Default\Cache" 2>nul
        if %errorlevel% equ 0 (
            echo General Edge cache cleared successfully.
        ) else (
            echo Warning: Could not clear general Edge cache. It may be in use.
        )
    ) else (
        echo General Edge cache not found.
    )
    
    echo Edge cache clearing completed.
) else (
    echo.
    echo Error: Failed to pull changes. Please check for merge conflicts or network issues.
)

echo.
pause
