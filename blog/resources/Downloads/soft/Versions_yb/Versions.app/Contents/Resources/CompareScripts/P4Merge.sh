#!/bin/bash --login

P4MERGE=`"$VERSIONS_LOCATION"/Contents/MacOS/FindApplication com.perforce.p4merge`
"$P4MERGE/Contents/Resources/launchp4merge" "$1" "$2"