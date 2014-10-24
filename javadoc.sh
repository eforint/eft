#!/bin/sh
CP=eft.jar:lib/*:conf
SP=src/java/

/bin/rm -rf html/doc/*

javadoc -quiet -sourcepath $SP -classpath $CP -protected -splitindex -subpackages eft -d html/doc/
