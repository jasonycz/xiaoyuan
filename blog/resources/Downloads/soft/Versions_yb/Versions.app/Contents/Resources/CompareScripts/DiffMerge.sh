#!/bin/bash

DIFFMERGE=`"$VERSIONS_LOCATION"/Contents/MacOS/FindApplication com.sourcegear.DiffMerge`
"$DIFFMERGE/Contents/MacOS/DiffMerge" "$1" "$2"