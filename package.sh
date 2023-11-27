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
    images                     \
    dist

# 打包压缩 dist 文件夹
zip -r baicizhan-helper.zip dist