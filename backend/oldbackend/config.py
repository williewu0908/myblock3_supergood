import os

# 獲取當前文件所在的目錄
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# SQLite 數據庫文件路徑
DB_PATH = os.path.join(BASE_DIR, 'myblock.db')

# SQLite 連接字符串
DB_URL = f'sqlite:///{DB_PATH}'

