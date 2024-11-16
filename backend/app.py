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
redis_client = redis.Redis(host='127.0.0.1', port=6379, db=0)

# MySQL 連接設置
db_config = {
    'host': '140.127.74.13',
    'user': 'edutool',
    'password': 'EduTool97531!',
    'database': 'edutool'
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
            if request.is_json:
                return jsonify({'error': 'Unauthorized', 'redirect': LOGIN_URL}), 401
            return redirect(LOGIN_URL)
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

@app.route('/api/projects/<int:project_id>', methods=['DELETE'])
@login_required
def delete_project(project_id):
    """刪除專案"""
    user, _ = get_user_from_session()
    
    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor()
    
    try:
        cursor.execute("SELECT user_id FROM blockly_projects WHERE id = %s", (project_id,))
        project = cursor.fetchone()
        
        if not project or project[0] != user['Id']:
            return jsonify({'error': 'Project not found or unauthorized'}), 404
        
        cursor.execute("DELETE FROM blockly_projects WHERE id = %s", (project_id,))
        conn.commit()
        
        return jsonify({'message': 'Project deleted successfully'})
    except mysql.connector.Error as err:
        return jsonify({'error': str(err)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/projects/<int:project_id>/name', methods=['PUT'])
@login_required
def update_project_name(project_id):
    """修改專案名稱"""
    user, _ = get_user_from_session()
    
    data = request.get_json()
    if not data or 'project_name' not in data:
        return jsonify({'error': 'New project name is required'}), 400
    
    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor()
    
    try:
        cursor.execute("SELECT user_id FROM blockly_projects WHERE id = %s", (project_id,))
        project = cursor.fetchone()
        
        if not project or project[0] != user['Id']:
            return jsonify({'error': 'Project not found or unauthorized'}), 404
        
        cursor.execute(
            "UPDATE blockly_projects SET project_name = %s WHERE id = %s",
            (data['project_name'], project_id)
        )
        conn.commit()
        
        return jsonify({'message': 'Project name updated successfully'})
    except mysql.connector.Error as err:
        return jsonify({'error': str(err)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/projects/<int:project_id>/content', methods=['PUT'])
@login_required
def update_project_content(project_id):
    """更新專案內容"""
    user, _ = get_user_from_session()
    
    data = request.get_json()
    if not data or ('code' not in data and 'blockly_code' not in data):
        return jsonify({'error': 'Code or blockly_code is required'}), 400
    
    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor()
    
    try:
        cursor.execute("SELECT user_id FROM blockly_projects WHERE id = %s", (project_id,))
        project = cursor.fetchone()
        
        if not project or project[0] != user['Id']:
            return jsonify({'error': 'Project not found or unauthorized'}), 404
        
        update_fields = []
        values = []
        if 'code' in data:
            update_fields.append("code = %s")
            values.append(data['code'])
        if 'blockly_code' in data:
            update_fields.append("blockly_code = %s")
            values.append(data['blockly_code'])
        
        values.append(project_id)
        cursor.execute(
            f"UPDATE blockly_projects SET {', '.join(update_fields)} WHERE id = %s",
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
        
        flowchart = Flowchart.from_code(python_code)
        diagram_code = flowchart.flowchart()
        
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

        api_key = config["API-KEY"]
        url = "https://api.openai.com/v1/"

        if model == 'Llama3-8B':
            url = 'http://192.168.194.39:8000/v1/'
            api_key = 'sk-no-require'  # llama3 不需要 API key
        elif model == 'GPT3.5':
            model = 'gpt-3.5-turbo-0125'
        elif model == 'GPT4':
            model = 'gpt-4o'

        ai_response = generate_ans(url, api_key, model, chat_log, selected_character)

        if ai_response:
            return jsonify({"airesponse": ai_response}), 200
        else:
            return jsonify({"error": "Server error"}), 500
    else:
        return jsonify({"error": f"Method {request.method} Not Allowed"}), 405

@app.route('/whois')
def index():
    user, error = get_user_from_session()
    if error:
        return error
    return jsonify({'username': user['Username']})

if __name__ == '__main__':
    app.run(port=5500, debug=True)