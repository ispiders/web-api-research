@echo off

set sourcePath=%1
set targetPath=%2
set d=%3
set t=%4

if "%d%" == "" set d="%date:~0,10%"
if "%t%" == "" set t="00:00"

if "%targetPath%"=="" (goto :Help)

dir %sourcePath% /A-D /O-D | findstr %d% > dir.tmp

for /f "usebackq tokens=1,2,4" %%i in (dir.tmp); do (
    ::move %sourcePath%\%%k %targetPath%
    echo "move %sourcePath%\%%k %targetPath%";

    if "%%i %%j" Lss "%d% %t%" (goto :Finish)
)

:Finish
del dir.tmp
echo "finish"

if "%targetPath%"=="" (
    :Help
    echo "usage: .\this.bat <sourcePath> <targetPath> [date [time]]"
)
