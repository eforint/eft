#!/bin/sh
CP="conf/;classes/;lib/*"
SP=src/java/

/bin/mkdir -p classes/

javac -sourcepath $SP -classpath $CP -d classes/ src/java/eft/*.java src/java/eft/*/*.java || exit 1

/bin/rm -f eft.jar 
jar cf eft.jar -C classes . || exit 1
/bin/rm -rf classes

echo "eft.jar generated successfully"
