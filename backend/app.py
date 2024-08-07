from flask import Flask, request, jsonify
from flask_cors import CORS
import pyflowchart as pfc

app = Flask(__name__)
CORS(app)

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
        print('diagram code:\n',diagram_code)
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

if __name__ == '__main__':
    app.run(debug=True)
