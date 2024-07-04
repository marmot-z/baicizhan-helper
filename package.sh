#!/bin/bash
#
# 构建脚本
# 依赖于 jq  命令，需提前安装

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

# 记录版本
version=$(jq -r '.version' manifest.json)
echo "

window.__baicizhanHelper__.version='$version';" >> dist/src/js/options.js

# 打包压缩 dist 文件夹
zip -r baicizhan-helper.zip dist