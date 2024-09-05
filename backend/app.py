from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlalchemy
import pyflowchart as pfc
from dotenv import load_dotenv
import os

# 加載 .env 文件中的環境變量
load_dotenv(".env.database")

# 使用環境變量來存儲敏感信息
DB_USER = os.getenv('DB_USER', 'default_user')
DB_PASS = os.getenv('DB_PASS', 'default_pass')
DB_HOST = os.getenv('DB_HOST', 'localhost')
DB_NAME = os.getenv('DB_NAME', 'myblock3')

# 動態構建數據庫 URL
DB_URL = f'mysql+pymysql://{DB_USER}:{DB_PASS}@{DB_HOST}:3306/{DB_NAME}'

# 創建 SQLAlchemy 引擎，並使用連接池提高效率
engine = sqlalchemy.create_engine(DB_URL, pool_recycle=280)

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}}, supports_credentials=True)

@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')  # 指定前端地址
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    response.headers.add('Access-Control-Allow-Credentials', 'true')  # 這一行確保標頭設置為 true
    return response

def generate_flowchart_code(python_code):
    fc = pfc.Flowchart.from_code(python_code)
    flowchart_code = fc.flowchart()
    return flowchart_code

@app.route('/flowchart', methods=['POST'])
def flowchart():
    data = request.get_json()
    python_code = data.get('code', '')
    print('python code:\n', python_code)
    try:
        diagram_code = generate_flowchart_code(python_code)
        print('diagram code:\n', diagram_code)
        return jsonify({'diagramCode': diagram_code})
    except Exception as e:
        print('錯誤', e)
        return jsonify({'error': str(e)}), 400

@app.route('/test', methods=['POST'])
def testhello():
    data = request.get_json()
    python_code = data.get('code', '')
    print('python code:\n', python_code)
    try:
        return jsonify({'diagramCode': "hello"})
    except Exception as e:
        print('錯誤', e)
        return jsonify({'error': str(e)}), 400

@app.route('/searchDB', methods=['GET'])
def searchDB():
    conn = None
    try:
        conn = engine.connect()
        
        query = sqlalchemy.text('SELECT project_name FROM `projects` WHERE user_id=1')
        result_set = conn.execute(query)
        
        projects = [row[0] for row in result_set]
        print(projects)
        return jsonify(projects)
    
    except Exception as e:
        print(f"Error during database query: {e}")
        return jsonify({"error": str(e)}), 500

    finally:
        if conn is not None:
            conn.close()

@app.route('/addToDB', methods=['POST', 'OPTIONS'])
def addToDB():
    if request.method.lower() == 'options':
        return '', 200
    
    try:
        data = request.get_json()
        project_name = data.get('projectname')
        json_code = data.get('JSONcode')
        
        print(f"Received project_name: {project_name}")
        print(f"Received json_code: {json_code}")
        
        if not project_name or not json_code:
            return jsonify({"error": "Invalid input"}), 400
        
        # 開始事務
        with engine.begin() as conn:
            query = sqlalchemy.text("INSERT INTO `projects` (`id`, `user_id`, `project_name`, `json_code`, `create_at`, `update_at`) VALUES (NULL, '1', :project_name, :json_code, current_timestamp(), current_timestamp());")
            conn.execute(query, {'project_name': project_name, 'json_code': json_code})
        
        return jsonify({"message": "Project added successfully"}), 201
    
    except Exception as e:
        print(f"Error during database query: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/deleteFromDB', methods=['POST', 'OPTIONS'])
def deleteFromDB():
    if request.method.lower() == 'options':
        return '', 200

    try:
        data = request.get_json()
        project_name = data.get('projectname')
        
        if not project_name:
            return jsonify({"error": "Invalid input"}), 400

        # 刪除指定的項目
        with engine.begin() as conn:
            query = sqlalchemy.text("DELETE FROM `projects` WHERE `user_id`=1 AND `project_name`=:project_name")
            conn.execute(query, {'project_name': project_name})

        return jsonify({"message": "Project deleted successfully"}), 200

    except Exception as e:
        print(f"Error during database deletion: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/changeProjectName', methods=['POST', 'OPTIONS'])
def changeProjectName():
    if request.method.lower() == 'options':
        return '', 200

    try:
        data = request.get_json()
        old_project_name = data.get('oldProjectName')
        new_project_name = data.get('newProjectName')

        if not old_project_name or not new_project_name:
            return jsonify({"error": "Invalid input"}), 400

        # 更新項目名稱
        with engine.begin() as conn:
            query = sqlalchemy.text("UPDATE `projects` SET `project_name`=:new_project_name WHERE `user_id`=1 AND `project_name`=:old_project_name")
            conn.execute(query, {'old_project_name': old_project_name, 'new_project_name': new_project_name})

        return jsonify({"message": "Project name updated successfully"}), 200

    except Exception as e:
        print(f"Error during database update: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
