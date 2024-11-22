#!/bin/bash

# 切換到指定目錄
echo "切換到 /var/www/html/myBlock3/client/ 目錄..."
cd /var/www/html/myBlock3/client/ || {
    echo "錯誤：無法切換到指定目錄！"
    exit 1
}

# 刪除目錄中的所有檔案
echo "刪除當前目錄中的所有檔案..."
rm -rf *

# Clone GitHub repository
echo "正在從GitHub克隆專案..."
git clone https://github.com/williewu0908/myblock3_supergood.git || {
    echo "錯誤：Git克隆失敗！"
    exit 1
}

# 進入專案目錄
echo "進入 myblock3_supergood 目錄..."
cd myblock3_supergood || {
    echo "錯誤：無法進入專案目錄！"
    exit 1
}

# 安裝依賴
echo "執行 npm install..."
npm install || {
    echo "錯誤：npm install 失敗！"
    exit 1
}

# 建置專案
echo "執行 npm run build..."
npm run build || {
    echo "錯誤：npm run build 失敗！"
    exit 1
}

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

echo "所有操作已完成！"
