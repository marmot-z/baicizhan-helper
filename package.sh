env="${1:-dev}"

# TODO minify js、css
# 重新创建 dist 文件夹
rm -rf ./dist
rm -f baicizhan-helper.zip
mkdir dist

# 将 src、src/assets/images/icon.png、manifest.json 拷贝到 dist 文件夹中
cp -vR src                     \
    src/assets/images/icon.png \
    src/assets/images/svgs     \
    manifest.json              \
    dist

# 打包压缩 dist 文件夹
zip -r baicizhan-helper.zip dist

# if [ "$env" = "prd" ]; then
#     # js minify
#     uglifyjs src/content-scripts/icon-tips.js \
#             src/content-scripts/my-webui-popover.js \
#             src/content-scripts/content-script.js \
#             -o dist/assets/content-script.min.js -c -m

#     uglifyjs src/content-scripts/background.js -o dist/assets/background.min.js -c -m

#     cp -v src/content-scripts/assets/jquery-3.6.0/jquery-3.6.0.min.js \
#         src/content-scripts/assets/webui-popover/jquery.webui-popover.min.js \
#         src/content-scripts/assets/webui-popover/jquery.webui-popover.min.css \
#         src/content-scripts/assets/*.svg \
#         dist/assets

#     cp manifest.json dist
# elif [ "$env" = "dev" ]; then
#     cp -v src/content-scripts/*.js \
#         src/content-scripts/assets/jquery-3.6.0/jquery-3.6.0.min.js \
#         src/content-scripts/assets/webui-popover/jquery.webui-popover.js \
#         src/content-scripts/assets/webui-popover/jquery.webui-popover.css \
#         src/content-scripts/assets/*.svg \
#         dist/assets

#     jq '.background.service_worker |= "assets/background.js" | 
#         .content_scripts[0].js |= [
#             "assets/jquery-3.6.0.min.js",
#             "assets/jquery.webui-popover.js",
#             "assets/icon-tips.js",
#             "assets/my-webui-popover.js",
#             "assets/content-script.js"
#         ] | 
#         .content_scripts[0].css |= ["assets/jquery.webui-popover.css"]' \
#     manifest.json > dist/manifest.json
# fi

# zip -r baicizhan-helper.zip dist