from flask import Flask, request, jsonify
from flask_cors import CORS
from pyflowchart import Flowchart

app = Flask(__name__)
CORS(app)  # 啟用 CORS 以允許前端進行跨域請求

@app.route('/flowchart', methods=['POST'])
def generate_flowchart():
    """處理前端的流程圖生成請求"""
    try:
        data = request.get_json()
        python_code = data.get('code', '')
        
        # 使用 pyflowchart 生成流程圖
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

if __name__ == '__main__':
    app.run(debug=True)


#http://127.0.0.1:5000/flowchart