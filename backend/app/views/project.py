from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from app.controllers.project_controller import get_user_projects, add_project, delete_project, update_project

bp = Blueprint('project', __name__, url_prefix='/project')

@bp.route('/list', methods=['GET'])
@login_required
def list_projects():
    projects = get_user_projects()
    return jsonify([{"id": p.id, "name": p.project_name} for p in projects]), 200

@bp.route('/add', methods=['POST'])
@login_required
def add_new_project():
    data = request.get_json()
    project_name = data.get('projectname')
    code = data.get('code')
    
    if not project_name or not code:
        return jsonify({"error": "Invalid input"}), 400
    
    add_project(project_name, code)
    return jsonify({"message": "Project added successfully"}), 201

@bp.route('/delete/<int:project_id>', methods=['DELETE'])
@login_required
def delete_user_project(project_id):
    if delete_project(project_id):
        return jsonify({"message": "Project deleted successfully"}), 200
    else:
        return jsonify({"error": "Project not found or unauthorized"}), 404

@bp.route('/update/<int:project_id>', methods=['PUT'])
@login_required
def update_user_project(project_id):
    data = request.get_json()
    new_name = data.get('projectname')
    new_code = data.get('code')
    
    if not new_name or not new_code:
        return jsonify({"error": "Invalid input"}), 400
    
    if update_project(project_id, new_name, new_code):
        return jsonify({"message": "Project updated successfully"}), 200
    else:
        return jsonify({"error": "Project not found or unauthorized"}), 404
