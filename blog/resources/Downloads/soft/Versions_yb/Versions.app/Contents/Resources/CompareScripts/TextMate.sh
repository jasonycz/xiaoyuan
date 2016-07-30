#!/bin/bash --login

MATE=`which mate`

if [[ -z "$MATE" ]]; then
	MATE=`"$VERSIONS_LOCATION"/Contents/MacOS/FindApplication com.macromates.textmate`/Contents/Resources/mate
fi

if [[ ! -e "$MATE" ]]; then
	echo "The 'mate' tool could not be found. To use TextMate with Versions, select Help->Terminal Usage... in TextMate" >&2
	exit 1
fi

# Use mate -a to do this async. Otherwise Versions is reactivated when the diff is closed.
# which would be nice, but causes weird issues if multiple Versions are installed
diff -u "$1" "$2" | "$MATE" -a