@ECHO OFF
IF EXIST java (
	start "EFT EIP" java -cp eft.jar;lib\*;conf eft.Eft
) ELSE (
	IF EXIST "%PROGRAMFILES%\Java\jre7" (
		start "EFT EIP" "%PROGRAMFILES%\Java\jre7\bin\java.exe" -cp eft.jar;lib\*;conf eft.Eft
	) ELSE (
		IF EXIST "%PROGRAMFILES(X86)%\Java\jre7" (
			start "EFT EIP" "%PROGRAMFILES(X86)%\Java\jre7\bin\java.exe" -cp eft.jar;lib\*;conf eft.Eft
		) ELSE (
			ECHO Java software not found on your system. Please go to http://java.com/en/ to download a copy of Java.
			PAUSE
		)
	)
)

