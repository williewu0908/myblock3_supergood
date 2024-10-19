from flask import Blueprint, request, jsonify
from app.controllers.project_controller import get_user_projects, add_project, delete_project, update_project
from app.models.user import User

bp = Blueprint('project', __name__, url_prefix='/project')

def check_auth(data):
    username = data.get('username')
    email = data.get('email')
    encoded_data = data.get('encoded_data')
    
    user = User.query.filter_by(username=username, email=email).first()
    
    if user and User.verify_encoded_data(username, email, encoded_data):
        return True, user
    else:
        return False, None

@bp.route('/list', methods=['POST'])
def list_projects():
    data = request.get_json()
    is_authenticated, user = check_auth(data)
    
    if not is_authenticated:
        return jsonify({"error": "Unauthorized"}), 401
    
    projects = get_user_projects(user.username)
    return jsonify([{"id": p.id, "name": p.project_name} for p in projects]), 200

@bp.route('/add', methods=['POST'])
def add_new_project():
    data = request.get_json()
    is_authenticated, user = check_auth(data)
    
    if not is_authenticated:
        return jsonify({"error": "Unauthorized"}), 401
    
    project_name = data.get('projectname')
    code = data.get('code')
    blockly_code = data.get('blockly_code')
    
    if not project_name or not code or not blockly_code:
        return jsonify({"error": "Invalid input"}), 400
    
    add_project(user.username, project_name, code, blockly_code)
    return jsonify({"message": "Project added successfully"}), 201

@bp.route('/delete/<int:project_id>', methods=['POST'])
def delete_user_project(project_id):
    data = request.get_json()
    is_authenticated, user = check_auth(data)
    
    if not is_authenticated:
        return jsonify({"error": "Unauthorized"}), 401
    
    if delete_project(user.username, project_id):
        return jsonify({"message": "Project deleted successfully"}), 200
    else:
        return jsonify({"error": "Project not found or unauthorized"}), 404

@bp.route('/update/<int:project_id>', methods=['POST'])
def update_user_project(project_id):
    data = request.get_json()
    is_authenticated, user = check_auth(data)
    
    if not is_authenticated:
        return jsonify({"error": "Unauthorized"}), 401
    
    new_name = data.get('projectname')
    new_code = data.get('code')
    new_blockly_code = data.get('blockly_code')
    
    if not new_name or not new_code or not new_blockly_code:
        return jsonify({"error": "Invalid input"}), 400
    
    if update_project(user.username, project_id, new_name, new_code, new_blockly_code):
        return jsonify({"message": "Project updated successfully"}), 200
    else:
        return jsonify({"error": "Project not found or unauthorized"}), 404
