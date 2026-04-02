@echo off
setlocal
echo [noop_npm] npm invocation blocked by workspace policy.
echo [noop_npm] Args: %*
exit /b 1
