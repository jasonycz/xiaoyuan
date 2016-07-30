#!/bin/bash --login

DELTAWALKER=`"$VERSIONS_LOCATION"/Contents/MacOS/FindApplication com.deltopia.deltawalker`
"$DELTAWALKER/Contents/MacOS/DeltaWalker" -nosplash "$1" "$2"