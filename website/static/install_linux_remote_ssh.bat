@echo off
setlocal ENABLEDELAYEDEXPANSION

:: Usage check
if "%~1"=="" (
    echo Usage: %~nx0 ^<remote-user@host^> [tar.gz path or URL]
    echo Example: %~nx0 user@host C:\path\vscodium-reh-linux-x64.tar.gz
    echo Example: %~nx0 user@host https://example.com/vscodium-reh-linux-x64.tar.gz
    exit /b 1
)

set "REMOTE_HOST=%~1"
set "TAR_SOURCE=%~2"

set "REMOTE_HOME=~"

echo Identifying local vscodium commit hash and client version.
set "LINE_NUM=0"
set "COMMIT="
for /f "usebackq delims=" %%i in (`codium --version`) do (
    set /a LINE_NUM+=1
	if !LINE_NUM! EQU 1 (
	    set "CLIENTVER=%%i"
	)
    if !LINE_NUM! EQU 2 (
        set "COMMIT=%%i"
    )
)
if not defined COMMIT (
    echo Failed to extract commit hash from codium --version
    exit /b 1
)
echo Client Version: %CLIENTVER%
echo Commit hash: %COMMIT%
set "REMOTE_DIR=%REMOTE_HOME%/.vscodium-server/bin/%COMMIT%"

if "%TAR_SOURCE%"=="" (
    echo No tarball specified, guessing URL.
    set "TAR_SOURCE=https://github.com/VSCodium/vscodium/releases/download/%CLIENTVER%/vscodium-reh-linux-x64-%CLIENTVER%.tar.gz"
	echo Downloading from !TAR_SOURCE!.
)

echo Checking if tarball source is URL.
echo %TAR_SOURCE% | findstr /b /i "http" >nul
set "IS_URL=false"
if !errorlevel! == 0 (
    set "IS_URL=true"
)


if "%IS_URL%"=="true" (
	set "SSH_REMOTE_CMD=mkdir -p %REMOTE_DIR%"
    set "SSH_REMOTE_CMD=!SSH_REMOTE_CMD! && cd %REMOTE_DIR%"
	set "SSH_REMOTE_CMD=!SSH_REMOTE_CMD! && curl -L -o vscode-server.tar.gz \"%TAR_SOURCE%\""
	set "SSH_REMOTE_CMD=!SSH_REMOTE_CMD! && tar -xzf vscode-server.tar.gz"
	set "SSH_REMOTE_CMD=!SSH_REMOTE_CMD! && touch vscode-scp-done.flag"
	set "SSH_REMOTE_CMD=!SSH_REMOTE_CMD! && echo Remote install complete."

	echo Source is a URL. Using curl on the remote host.
    ssh %REMOTE_HOST% "!SSH_REMOTE_CMD!"
	
) else (
    :: Note: cmd.exe has no native way to stream binary to ssh.
    echo Source is a local file. This will require 3 logins.
    
	set "SSH_REMOTE_CMD=mkdir -p %REMOTE_DIR%"
    set "SSH_REMOTE_CMD=!SSH_REMOTE_CMD! && cd %REMOTE_DIR%"
	echo Creating folder.
	ssh %REMOTE_HOST% "!SSH_REMOTE_CMD!"
	
	echo SCPing tarball.
	scp "%TAR_SOURCE%" %REMOTE_HOST%:%REMOTE_DIR%/vscode-server.tar.gz
	
	echo Extract tarball.
	set "SSH_REMOTE_CMD=cd %REMOTE_DIR%"
	set "SSH_REMOTE_CMD=!SSH_REMOTE_CMD! && tar -xzf vscode-server.tar.gz"
	set "SSH_REMOTE_CMD=!SSH_REMOTE_CMD! && touch vscode-scp-done.flag"
	set "SSH_REMOTE_CMD=!SSH_REMOTE_CMD! && echo Remote install complete."
	ssh %REMOTE_HOST% "!SSH_REMOTE_CMD!"
)

echo Done. VSCodium Remote Extension Host installed in %REMOTE_DIR%

endlocal