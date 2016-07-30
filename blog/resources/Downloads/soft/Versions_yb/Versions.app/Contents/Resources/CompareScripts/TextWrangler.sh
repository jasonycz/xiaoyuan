#!/bin/sh

/usr/bin/osascript - "$@" << END

on run argv
	set firstPath to the first item in argv
	set firstPath to POSIX file firstPath
	set secondPath to the second item in argv
	set secondPath to POSIX file secondPath

	-- Change to 'tell application id "com...."'
	-- for leopard
	tell application "TextWrangler"
		activate
	    compare firstPath against secondPath
	end tell
end run

END