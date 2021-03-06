#!/bin/sh

/usr/bin/osascript - "$@" << END

on run argv
	set firstPath to the first item in argv
	set firstPath to POSIX file firstPath
	set secondPath to the second item in argv
	set secondPath to POSIX file secondPath

	-- Change to 'tell application id "com.barebones.bbedit"'
	-- for leopard. Won't work if it can't find BBedit
	tell application "BBEdit"
	    activate
	    compare firstPath against secondPath options {ignore RCS keywords:true}
	end tell
end run

END