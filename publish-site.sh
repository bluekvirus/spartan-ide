#!/bin/bash

#build demo site
rm -rf ./dist/app
stagejs build ./dist/app

#update site
rm -rf ../site/*
cp -r ./dist/app/. ../site/
cd ../site
git pull
git add -A
git commit -m "sync site with master branch"
git push origin gh-pages
