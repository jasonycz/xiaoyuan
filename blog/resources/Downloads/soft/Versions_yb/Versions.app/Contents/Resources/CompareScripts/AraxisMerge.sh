#!/bin/sh

/usr/bin/osascript - "$@" << END

on run argv
	set firstPath to the first item in argv
	set secondPath to the second item in argv
	
	tell application "Araxis Merge"
		launch
		compare(firstPath, secondPath)
		activate
	end tell
end run

END