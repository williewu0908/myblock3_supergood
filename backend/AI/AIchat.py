from flask import Flask, request, jsonify
import openai
import os
from dotenv import dotenv_values
from flask_cors import CORS, cross_origin


app = Flask(__name__)
CORS(app)
config = dotenv_values(".env")

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

@app.route('/generate-answer', methods=['POST'])
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

if __name__ == '__main__':
    app.run(debug=True)
