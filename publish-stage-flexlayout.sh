#!/bin/bash

RELEASE=false

while [[ $# > 1 ]]
do
key="$1"

case $key in
    -v|--version) #version
    VERSION="$2"
    shift # past argument
    ;;
    -r|--release) #release or not
    RELEASE="$2"
    shift # past argument
    ;;
    --default) #flag argument (not used here)
    #DEFAULT=YES
    ;;
    *)
    ;;
esac

shift # past argument or value
done

#minify first
./minify.sh

#build demo site
rm -rf ./dist/app
stagejs build ./dist/app


#if release then push tag
if [ "$RELEASE" = true ] 
then
    #commit and push
    git add -A
    git commit -m "upgraded to $VERSION"
    git push origin master
    #create tag
    git tag -a $VERSION -m "upgraded to $VERSION"
    git push origin --tag
fi

#update site
rm -rf ../site/*
cp -r ./dist/app/. ../site/
cd ../site
git add -A
#different comment for release and non-release version
if [ "$RELEASE" = true ] 
then
    git commit -m "upgraded to $VERSION"
else
    git commit -m "sync site with master branch"
fi
git push origin gh-pages