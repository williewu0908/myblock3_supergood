from flask import Blueprint, request, jsonify
from flask_login import login_user, login_required, logout_user, current_user
from app.controllers.auth_controller import register_user, login_user_controller, logout_user_controller
from app.models.user import User

bp = Blueprint('auth', __name__, url_prefix='/auth')

@bp.route('/check-auth', methods=['GET'])
def check_auth():
    print("Checking auth...")
    
    # 打印所有收到的 headers
    print("Request headers:", request.headers)
    
    # 打印所有收到的 cookies
    print("Request cookies:", request.cookies)
    
    # 驗證是否登入
    print("Is authenticated:", current_user.is_authenticated)
    
    if current_user.is_authenticated:
        print("User:", current_user.username)
        return jsonify({"authenticated": True, "user": current_user.username}), 200
    else:
        print("User not authenticated")
        return jsonify({"authenticated": False}), 401



@bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    
    if not username or not email or not password:
        return jsonify({"error": "Missing required fields"}), 400
    
    try:
        register_user(username, email, password)
        return jsonify({"message": "User registered successfully"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    print(username)
    print(password)
    
    if not username or not password:
        return jsonify({"error": "Missing username or password"}), 400
    
    user = User.query.filter_by(username=username).first()
    if user and user.check_password(password):
        login_user(user)
        print("Is authenticated:", current_user.is_authenticated)
        return jsonify({"message": "Logged in successfully"}), 200
        
    else:
        return jsonify({"error": "帳號或密碼錯誤"}), 401

@bp.route('/logout', methods=['POST'])
@login_required
def logout():
    logout_user()
    return jsonify({"message": "Logged out successfully"}), 200