#!/bin/bash

export PATH=/usr/bin:/bin:/usr/sbin:/sbin:/usr/local/bin:/usr/X11/bin

FILEMERGE=`/usr/bin/which opendiff`
if [ ! -e "$FILEMERGE" ]; then
	FILEMERGE=/usr/bin/opendiff
fi

if [ ! -e "$FILEMERGE" ]; then
	FILEMERGE=/Developer/usr/bin/opendiff
fi

if [ ! -e "$FILEMERGE" ]; then
	echo "The FileMerge tool opendiff could not be located. Please install Xcode Tools from the Apple Developer website." >&2
	exit 1
fi

if [ -n "$3" ]; then
	"$FILEMERGE" "$1" "$2" -merge "$3"
else
	"$FILEMERGE" "$1" "$2"
fi