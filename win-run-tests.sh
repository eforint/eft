#!/bin/sh
CP="conf/;classes/;lib/*;testlib/*"
SP="src/java/;test/java/"
TESTS="eft.crypto.Curve25519Test eft.crypto.ReedSolomonTest"

/bin/mkdir -p classes/

javac -sourcepath $SP -classpath $CP -d classes/ src/java/eft/*.java src/java/eft/*/*.java test/java/eft/*/*.java || exit 1

java -classpath $CP org.junit.runner.JUnitCore $TESTS

/bin/rm -rf classes

