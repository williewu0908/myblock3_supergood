from flask import Blueprint, request, jsonify, session
from flask_login import login_user, login_required, logout_user, current_user
from app.controllers.auth_controller import register_user, login_user_controller, logout_user_controller
from app.models.user import User
from flask_cors import CORS

bp = Blueprint('auth', __name__, url_prefix='/auth')
CORS(bp, supports_credentials=True)

@bp.route('/check-auth', methods=['POST'])
def check_auth():
    data = request.get_json()
    username = data.get('username')
    email = data.get('email')
    encoded_data = data.get('encoded_data')
    
    user = User.query.filter_by(username=username, email=email).first()
    
    if user and User.verify_encoded_data(username, email, encoded_data):
        return jsonify({"authenticated": True, "user": user.username}), 200
    else:
        return jsonify({"authenticated": False}), 401

@bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    if not username or not password:
        return jsonify({"error": "Missing username or password"}), 400
    
    success, username, email = login_user_controller(username, password)
    if success:
        user = User.query.filter_by(username=username).first()
        encoded_data = user.encoded_username_email
        return jsonify({
            "message": "Logged in successfully",
            "username": username,
            "email": email,
            "encoded_data": encoded_data
        }), 200
    else:
        return jsonify({"error": "帳號或密碼錯誤"}), 401



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

@bp.route('/logout', methods=['POST'])
@login_required
def logout():
    logout_user()
    return jsonify({"message": "Logged out successfully"}), 200