#!/bin/bash

# 確保目標目錄存在
if [ ! -d "/var/www/html/myblock3c" ]; then
    echo "目標目錄不存在，正在創建..."
    mkdir -p /var/www/html/myblock3c
fi

# 刪除目標目錄中的所有檔案
echo "正在刪除 /var/www/html/myblock3c 中的所有檔案..."
rm -rf /var/www/html/myblock3c/*

# 確保來源目錄存在
if [ ! -d "/var/www/html/myBlock3/client/myblock3_supergood/out" ]; then
    echo "錯誤：來源目錄不存在！"
    exit 1
fi

# 複製檔案
echo "正在複製檔案..."
cp -r /var/www/html/myBlock3/client/myblock3_supergood/out/* /var/www/html/myblock3c/

# 檢查複製是否成功
if [ $? -eq 0 ]; then
    echo "檔案複製完成！"
else
    echo "錯誤：檔案複製失敗！"
    exit 1
fi
