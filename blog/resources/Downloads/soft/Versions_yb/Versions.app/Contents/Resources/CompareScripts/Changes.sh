#!/bin/bash

CHANGES=`"$VERSIONS_LOCATION"/Contents/MacOS/FindApplication com.bitbq.Changes`
if [ "$CHANGES" = "" ]
then
	CHANGES=`"$VERSIONS_LOCATION"/Contents/MacOS/FindApplication com.skorpiostech.Changes`
fi

"$CHANGES/Contents/Resources/chdiff" "$1" "$2"