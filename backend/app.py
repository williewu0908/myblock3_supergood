from flask import Flask, request, render_template, jsonify, redirect
import redis
import mysql.connector
from datetime import datetime
import os
import openai
from dotenv import dotenv_values
from pyflowchart import Flowchart

app = Flask(__name__)

# Redis 連接設置
# 讀取環境變數，如果沒讀到則使用預設值
redis_host = os.environ.get('REDIS_HOST', '127.0.0.1')
redis_port = int(os.environ.get('REDIS_PORT', 6379))
redis_password = os.environ.get('REDIS_PASSWORD', None)

redis_client = redis.Redis(
    host=redis_host, 
    port=redis_port, 
    password=redis_password, 
    db=0
)

# MySQL 連接設置
db_config = {
    'host': os.environ.get('DB_HOST', 'db'), # 對應 docker-compose 的 service name
    'user': os.environ.get('DB_USER', 'edutool'),
    'password': os.environ.get('DB_PASSWORD', 'EduTool97531!'),
    'database': os.environ.get('DB_NAME', 'edutool')
}

LOGIN_URL = 'https://sw-hie-ie.nknu.edu.tw/myLogin/index.html'

def get_user_from_session():
    """通用函數：從 session 獲取用戶信息"""
    php_session_id = request.cookies.get('PHPSESSID')
    if not php_session_id:
        return None, "No PHP Session ID found"
    
    session_data = redis_client.get(f"php_session:{php_session_id}")
    if not session_data:
        return None, "No session data found"
    
    session_data = session_data.decode('utf-8')
    token = eval(session_data).get('Token')
    if not token:
        return None, "No token found in session"
    
    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor(dictionary=True)
    
    cursor.execute("SELECT * FROM users WHERE Token_Login = %s", (token,))
    user = cursor.fetchone()
    
    cursor.close()
    conn.close()
    
    if not user:
        return None, "User not found"
    
    return user, None

def login_required(f):
    """裝飾器：檢查用戶是否已登入"""
    def decorated_function(*args, **kwargs):
        user, error = get_user_from_session()
        if error:
            return jsonify({
                'error': 'Unauthorized',
                'message': '請先登入'
            }), 401
        return f(*args, **kwargs)
    decorated_function.__name__ = f.__name__ 
    return decorated_function


@app.route('/api/projects', methods=['GET'])
@login_required
def list_projects():
    """列出使用者所有專案"""
    user, _ = get_user_from_session()  # 已經在裝飾器中確認過用戶存在
    
    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor(dictionary=True)
    
    cursor.execute("SELECT id, project_name, created_at, updated_at FROM blockly_projects WHERE user_id = %s", (user['Id'],))
    projects = cursor.fetchall()
    
    cursor.close()
    conn.close()
    
    return jsonify({'projects': projects})

@app.route('/api/projects', methods=['POST'])
@login_required
def create_project():
    """新增專案"""
    user, _ = get_user_from_session()
    
    data = request.get_json()
    if not data or 'project_name' not in data:
        return jsonify({'error': 'Project name is required'}), 400
    
    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor()
    
    try:
        # 檢查是否已存在同名專案
        cursor.execute(
            "SELECT id FROM blockly_projects WHERE user_id = %s AND project_name = %s",
            (user['Id'], data['project_name'])
        )
        existing_project = cursor.fetchone()
        
        if existing_project:
            return jsonify({'error': 'A project with this name already exists'}), 400
        
        cursor.execute(
            "INSERT INTO blockly_projects (user_id, project_name, code, blockly_code) VALUES (%s, %s, %s, %s)",
            (user['Id'], data['project_name'], data.get('code', ''), data.get('blockly_code', ''))
        )
        conn.commit()
        new_project_id = cursor.lastrowid
        
        return jsonify({
            'message': 'Project created successfully',
            'project_id': new_project_id
        })
    except mysql.connector.Error as err:
        return jsonify({'error': str(err)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/projects/<string:project_name>/code', methods=['GET'])
@login_required
def get_project_code(project_name):
    """獲取專案程式碼"""
    user, _ = get_user_from_session()
    
    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor(dictionary=True)
    
    try:
        # 檢查專案是否存在且屬於該用戶
        cursor.execute(
            "SELECT code, blockly_code FROM blockly_projects WHERE project_name = %s AND user_id = %s",
            (project_name, user['Id'])
        )
        project = cursor.fetchone()
        
        if not project:
            return jsonify({'error': 'Project not found or unauthorized'}), 404
        
        return jsonify({
            'code': project['code'],
            'blockly_code': project['blockly_code']
        })
        
    except mysql.connector.Error as err:
        return jsonify({'error': str(err)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/projects/<string:project_name>', methods=['DELETE'])
@login_required
def delete_project(project_name):
    """刪除專案"""
    user, _ = get_user_from_session()
    
    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor()
    
    try:
        # 檢查專案是否存在且屬於該用戶
        cursor.execute(
            "SELECT id FROM blockly_projects WHERE project_name = %s AND user_id = %s",
            (project_name, user['Id'])
        )
        project = cursor.fetchone()
        
        if not project:
            return jsonify({'error': 'Project not found or unauthorized'}), 404
        
        cursor.execute(
            "DELETE FROM blockly_projects WHERE project_name = %s AND user_id = %s",
            (project_name, user['Id'])
        )
        conn.commit()
        
        return jsonify({'message': 'Project deleted successfully'})
    except mysql.connector.Error as err:
        return jsonify({'error': str(err)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/projects/<string:old_project_name>/name', methods=['PUT'])
@login_required
def update_project_name(old_project_name):
    """修改專案名稱"""
    user, _ = get_user_from_session()
    
    data = request.get_json()
    if not data or 'project_name' not in data:
        return jsonify({'error': 'New project name is required'}), 400
    
    new_project_name = data['project_name']
    
    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor()
    
    try:
        # 檢查專案是否存在且屬於該用戶
        cursor.execute(
            "SELECT id FROM blockly_projects WHERE project_name = %s AND user_id = %s",
            (old_project_name, user['Id'])
        )
        project = cursor.fetchone()
        
        if not project:
            return jsonify({'error': 'Project not found or unauthorized'}), 404
            
        # 檢查新名稱是否已被使用
        cursor.execute(
            "SELECT id FROM blockly_projects WHERE project_name = %s AND user_id = %s AND project_name != %s",
            (new_project_name, user['Id'], old_project_name)
        )
        existing_project = cursor.fetchone()
        
        if existing_project:
            return jsonify({'error': 'A project with this name already exists'}), 400
        
        cursor.execute(
            "UPDATE blockly_projects SET project_name = %s WHERE project_name = %s AND user_id = %s",
            (new_project_name, old_project_name, user['Id'])
        )
        conn.commit()
        
        return jsonify({'message': 'Project name updated successfully'})
    except mysql.connector.Error as err:
        return jsonify({'error': str(err)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/projects/<string:project_name>/content', methods=['PUT'])
@login_required
def update_project_content(project_name):
    """更新專案內容"""
    user, _ = get_user_from_session()
    
    data = request.get_json()
    if not data or ('code' not in data and 'blockly_code' not in data):
        return jsonify({'error': 'Code or blockly_code is required'}), 400
    
    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor()
    
    try:
        # 檢查專案是否存在且屬於該用戶
        cursor.execute(
            "SELECT id FROM blockly_projects WHERE project_name = %s AND user_id = %s",
            (project_name, user['Id'])
        )
        project = cursor.fetchone()
        
        if not project:
            return jsonify({'error': 'Project not found or unauthorized'}), 404
        
        update_fields = []
        values = []
        if 'code' in data:
            update_fields.append("code = %s")
            values.append(data['code'])
        if 'blockly_code' in data:
            update_fields.append("blockly_code = %s")
            values.append(data['blockly_code'])
        
        values.extend([project_name, user['Id']])
        cursor.execute(
            f"UPDATE blockly_projects SET {', '.join(update_fields)} WHERE project_name = %s AND user_id = %s",
            tuple(values)
        )
        conn.commit()
        
        return jsonify({'message': 'Project content updated successfully'})
    except mysql.connector.Error as err:
        return jsonify({'error': str(err)}), 500
    finally:
        cursor.close()
        conn.close()
        
config = dotenv_values(".env")

@app.route('/api/flowchart', methods=['POST'])
def generate_flowchart():
    """處理前端的流程圖生成請求"""
    try:
        data = request.get_json()
        python_code = data.get('code', '')

        # 確保程式碼有正確的函數結構和縮排
        if not python_code.strip().startswith('def '):
            # 將每一行都進行縮排
            indented_code = '\n'.join('    ' + line for line in python_code.split('\n') if line.strip())
            python_code = f"def main():\n{indented_code}"
        
        flowchart = Flowchart.from_code(python_code)
        diagram_code = flowchart.flowchart()

        if 'st=>start' not in diagram_code:
            diagram_code = 'st=>start: Start\n' + diagram_code
        if 'e=>end' not in diagram_code:
            diagram_code = diagram_code + '\ne=>end: End'

        # 確保連接關係正確
        lines = diagram_code.split('\n')
        has_connections = False
        for line in lines:
            if '->' in line:
                has_connections = True
                break
                
        if not has_connections:
            # 尋找操作節點
            operations = [line.split('=>')[0] for line in lines if '=>operation:' in line]
            if operations:
                connections = f"\nst->{operations[0]}"
                if len(operations) > 1:
                    for i in range(len(operations)-1):
                        connections += f"->{operations[i+1]}"
                connections += "->e"
                diagram_code += connections
            else:
                diagram_code += "\nst->e"
        
        return jsonify({
            'success': True,
            'diagramCode': diagram_code
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

def generate_ans(url, api_key, model, chat_log, selected_character):
    openai.base_url = url
    openai.api_key = api_key

    prelude_messages_dict = {
        'CodingExpert': [
            {"role": "system", "content": "在接下來的對話中，請不要忘記以下設定：你是一個寫程式的專家，請用繁體中文給提問者解決程式中的錯誤，並給出範例。程式範例請使用<pre><code><code/><pre/>包裹起來，以便我進行特殊處理。"},
            {"role": "assistant", "content": "你好我是程式碼專家，請問有什麼需要幫忙的嗎？"},
            {"role": "user", "content": "print(\"Hello world')"},
            {"role": "assistant", "content": "在你的程式碼中有一個錯誤：引號沒有正確配對。請將引號正確配對即可解決問題。以下是修正後的程式碼範例：<pre><code>print('Hello world')<code/><pre/>"}
        ],
    }

    prelude_messages = prelude_messages_dict.get(selected_character, [])
    messages = prelude_messages + chat_log

    if messages and messages[-1]["role"] == "user":
        messages[-1]["content"] += '\n若是有代碼範例，請把每段代碼分別用<pre><code><code/><pre/>包裹起來'

    try:
        response = openai.chat.completions.create(
            model=model,
            messages=messages,
            max_tokens=2000,
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"Error occurred: {e}")
        return None

@app.route('/api/generate-answer', methods=['POST'])
def handler():
    if request.method == 'POST':
        data = request.json
        chat_log = data.get('chatLog', [])
        selected_character = data.get('selectedCharacter', 'CodingExpert')
        model = data.get('model', 'GPT3.5')

        api_key = os.environ.get("API_KEY")
        if not api_key:
             config = dotenv_values(".env")
             api_key = config.get("API-KEY")

        url = "https://api.openai.com/v1/"

        if model == 'Llama3-8B':
            url = 'http://192.168.194.39:8000/v1/'
            api_key = 'sk-no-require'  # llama3 不需要 API key
        elif model == 'GPT3.5':
            model = 'gpt-4o-mini'
        elif model == 'GPT4':
            model = 'gpt-4o-mini'

        ai_response = generate_ans(url, api_key, model, chat_log, selected_character)

        if ai_response:
            return jsonify({"airesponse": ai_response}), 200
        else:
            return jsonify({"error": "Server error"}), 500
    else:
        return jsonify({"error": f"Method {request.method} Not Allowed"}), 405

@app.route('/api/whois')
def index():
    user, error = get_user_from_session()
    if error:
        return error
    return jsonify({'username': user['Username']})

if __name__ == '__main__':
    app.run(port=5500, debug=True)