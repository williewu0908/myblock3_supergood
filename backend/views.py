from flask import Blueprint, request, jsonify
from controllers import generate_flowchart, search_db, add_to_db, delete_from_db, change_project_name, load_project, save_project

bp = Blueprint('main', __name__)

@bp.route('/flowchart', methods=['POST'])
def flowchart():
    data = request.get_json()
    python_code = data.get('code', '')
    print('發送flowchart')
    return generate_flowchart(python_code)

@bp.route('/test', methods=['POST'])
def test_hello():
    return jsonify({'diagramCode': "hello"})

@bp.route('/searchDB', methods=['GET'])
def search_db_route():
    username = request.args.get('username')
    if not username:
        return jsonify({"error": "Username is required"}), 400
    return search_db(username)

@bp.route('/addToDB', methods=['POST', 'OPTIONS'])
def add_to_db_route():
    if request.method.lower() == 'options':
        return '', 200
    data = request.get_json()
    return add_to_db(data)

@bp.route('/deleteFromDB', methods=['POST', 'OPTIONS'])
def delete_from_db_route():
    if request.method.lower() == 'options':
        return '', 200
    data = request.get_json()
    return delete_from_db(data)

@bp.route('/changeProjectName', methods=['POST', 'OPTIONS'])
def change_project_name_route():
    if request.method.lower() == 'options':
        return '', 200
    data = request.get_json()
    return change_project_name(data)

@bp.route('/loadProject', methods=['POST', 'OPTIONS'])
def load_project_route():
    if request.method.lower() == 'options':
        return '', 200
    data = request.get_json()
    return load_project(data)

@bp.route('/saveProject', methods=['POST', 'OPTIONS'])
def save_project_route():
    if request.method.lower() == 'options':
        return '', 200
    data = request.get_json()
    return save_project(data)


@bp.route('/test', methods=['GET', 'OPTIONS'])
def test_route():
    return jsonify({"message": "Test successful"}), 200