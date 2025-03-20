!include "getProcessInfo.nsh"
Var pid

!macro customCheckAppRunning
  SetDetailsPrint textonly
  ${GetProcessInfo} 0 $pid $1 $2 $3 $4
  ${if} $3 != "${APP_EXECUTABLE_FILENAME}"
    ${if} ${isUpdated}
      DetailPrint `Allow app to exit without explicit kill, sleeping for 5 sec...`
      Sleep 5000
    ${endIf}

    ${nsProcess::FindProcess} "${APP_EXECUTABLE_FILENAME}" $R0
    ${if} $R0 == 0
      DetailPrint `Find running process ${APP_EXECUTABLE_FILENAME}...`
      ${if} ${isUpdated}
        DetailPrint `Allow app to exit without explicit kill, sleeping for 5 sec...`
        Sleep 5000
      ${endIf}
      Goto doStopProcess
      Quit

      doStopProcess:
      DetailPrint `Closing running "${PRODUCT_NAME}"...`
      # https://github.com/electron-userland/electron-builder/issues/2516#issuecomment-372009092
      nsExec::Exec `taskkill /im "${APP_EXECUTABLE_FILENAME}" /fi "PID ne $pid"` $R0
      # to ensure that files are not "in-use"
      Sleep 3000

      # Retry counter
      StrCpy $R1 0
      # Max retry count
      StrCpy $R2 5

      loop:
        IntOp $R1 $R1 + 1

        ${nsProcess::FindProcess} "${APP_EXECUTABLE_FILENAME}" $R0
        ${if} $R0 == 0
          # wait to give a chance to exit gracefully
          DetailPrint `Waiting 5 sec until complete closure...`
          Sleep 5000
          nsExec::Exec `taskkill /f /im "${APP_EXECUTABLE_FILENAME}" /fi "PID ne $pid"` $R0
          ${If} $R0 != 0
            DetailPrint `Try $R1/$R2: Waiting for "${PRODUCT_NAME}" to close (taskkill exit code $R0) with 5 sec delay.`
            Sleep 5000
          ${else}
            Goto not_running
          ${endIf}
        ${else}
          Goto not_running
        ${endIf}

        # App likely running with elevated permissions.
        # Ask user to close it manually
        ${if} $R1 > $R2
          DetailPrint `Unable to close "${PRODUCT_NAME}" (taskkill exit code $R0). Maybe elevated? Kill it...`
          MessageBox MB_RETRYCANCEL|MB_ICONEXCLAMATION "$(appCannotBeClosed)" /SD IDCANCEL IDRETRY loop
          Quit
        ${else}
          Goto loop
        ${endIf}
      not_running:
        DetailPrint `Not running, continue installation...`
    ${endIf}
  ${endIf}
  SetDetailsPrint none
!macroend