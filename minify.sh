#minify new file first
#remove old files
rm ./implementation/js/flexlayout/flexlayout.min.js #flexlayout.min.js.gz

#uglify
#npm -g install uglify-js
echo 'uglifying'
uglifyjs ./implementation/js/flexlayout/flexlayout.js --compress --mangle --mangle-props --screw-ie8 --output ./implementation/js/flexlayout/flexlayout.u.js

#minify
#npm -g install minifier
echo 'minifying'
minify --output ./implementation/js/flexlayout/flexlayout.min.js  ./implementation/js/flexlayout/flexlayout.u.js

rm ./implementation/js/flexlayout/flexlayout.u.js

#copy to dist folder
rm ./dist/flexlayout/*.*
cp -r ./implementation/js/flexlayout/. ./dist/flexlayout/