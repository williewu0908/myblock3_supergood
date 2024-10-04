from flask import jsonify
import pyflowchart as pfc
from models import fetch_projects, add_project, delete_project, update_project_name, load_project as load_project_model, save_project as save_project_model

def generate_flowchart(python_code):
    try:
        fc = pfc.Flowchart.from_code(python_code)
        flowchart_code = fc.flowchart()
        return jsonify({'diagramCode': flowchart_code})
    except Exception as e:
        print('錯誤', e)
        return jsonify({'error': str(e)}), 400

def search_db(username):
    try:
        projects = fetch_projects(username)
        return jsonify(projects)
    except Exception as e:
        print(f"Error during database query: {e}")
        return jsonify({"error": str(e)}), 500

def add_to_db(data):
    try:
        username = data.get('username')
        project_name = data.get('projectname')
        json_code = data.get('JSONcode')
        
        if not username or not project_name or not json_code:
            return jsonify({"error": "Invalid input"}), 400
        
        add_project(username, project_name, json_code)
        return jsonify({"message": "Project added successfully"}), 201
    
    except Exception as e:
        print(f"Error during database query: {e}")
        return jsonify({"error": str(e)}), 500

def delete_from_db(data):
    try:
        username = data.get('username')
        project_name = data.get('projectname')
        
        if not username or not project_name:
            return jsonify({"error": "Invalid input"}), 400

        delete_project(username, project_name)
        return jsonify({"message": "Project deleted successfully"}), 200

    except Exception as e:
        print(f"Error during database deletion: {e}")
        return jsonify({"error": str(e)}), 500

def change_project_name(data):
    try:
        username = data.get('username')
        old_project_name = data.get('oldProjectName')
        new_project_name = data.get('newProjectName')

        if not username or not old_project_name or not new_project_name:
            return jsonify({"error": "Invalid input"}), 400

        update_project_name(username, old_project_name, new_project_name)
        return jsonify({"message": "Project name updated successfully"}), 200

    except Exception as e:
        print(f"Error during database update: {e}")
        return jsonify({"error": str(e)}), 500

def load_project(data):
    try:
        username = data.get('username')
        project_name = data.get('projectname')
        
        if not username or not project_name:
            return jsonify({"error": "Invalid input"}), 400

        json_code = load_project_model(username, project_name)
        if json_code:
            return jsonify(json_code), 200
        else:
            return jsonify({"error": "Project not found"}), 404

    except Exception as e:
        print(f"Error during database search: {e}")
        return jsonify({"error": str(e)}), 500

def save_project(data):
    try:
        username = data.get('username')
        project_name = data.get('projectname')
        json_code = data.get('JSONcode')
        
        if not username or not project_name or not json_code:
            return jsonify({"error": "Invalid input"}), 400
        
        save_project_model(username, project_name, json_code)
        return jsonify({"message": "Project updated successfully"}), 200
    
    except Exception as e:
        print(f"Error during database query: {e}")
        return jsonify({"error": str(e)}), 500
