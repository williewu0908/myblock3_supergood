from app import create_app, db
from flask import jsonify

app = create_app()

@app.errorhandler(401)
def unauthorized(error):
    return jsonify({"error": "Unauthorized access"}), 401

@app.errorhandler(403)
def forbidden(error):
    return jsonify({"error": "Forbidden"}), 403

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)



# 完整後端在 app資料夾中
# 結構如下：

# Models:
# 處理資料庫、資料的結構
# app/models/user.py:
# app/models/project.py:

# Views:
# 處理 HTTP 請求，再呼叫控制器方法，並返回響應。
# app/views/auth.py:
# 身份驗證相關的路由（註冊、登錄、登出），返回 JSON 響應。
# app/views/project.py:
# project相關的路由（列表、添加、刪除、更新），返回 JSON 響應。。

# Controllers:
# 應用的主要邏輯，連接模型和視圖。
# app/controllers/auth_controller.py:
# 用戶註冊、登錄、登出
# app/controllers/project_controller.py:
# project管理邏輯



# 測試帳號：
# {
#     "username": "testuser",
#     "email": "testuser@example.com",
#     "password": "securepassword123"
# }