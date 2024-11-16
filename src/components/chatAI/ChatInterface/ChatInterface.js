import { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import Image from 'next/image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane, faSpinner } from '@fortawesome/free-solid-svg-icons';
import DropDownMenu from '@/components/chatAI/ChatInterface/DropDownMenu';
import styles from '@/components/chatAI/ChatInterface/ChatInterface.module.css';
import Modal from '@/components/chatAI/ChatInterface/Modal';
import hljs from 'highlight.js';
import 'highlight.js/styles/default.css';
import { faTimes } from '@fortawesome/free-solid-svg-icons'; // 新增 faTimes
import IconButton from '@mui/material/IconButton';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';

function ChatInterface({ viewState }) {
  const countTrueValues = Object.values(viewState).filter(value => value === true).length;
  const defaultChat = [
    { role: 'assistant', content: '你好，有什麼需要幫助的嗎？' }
  ];

  const defaultQuestions = [
    { label: "優化", fullText: "幫我優化我的第{int}~{int}行程式碼" },
    { label: "除錯", fullText: "我在第{int}行出現錯誤，可以幫我看看嗎？" },
    { label: "迴圈", fullText: "可以解釋一下Python中的迴圈語法嗎？" },
    { label: "執行時間", fullText: "如何縮短我的程式碼執行時間？" },
    { label: "解釋", fullText: "可以幫我看看這段程式碼是什麼邏輯嗎" },
    { label: "範例", fullText: "可以給我一個{String}的邏輯範例嗎" }
  ];

  const [showInputFields, setShowInputFields] = useState(null); // 控制顯示的輸入框
  const [startLine, setStartLine] = useState(''); // 用於{int}~{int}的起始行號
  const [endLine, setEndLine] = useState(''); // 用於{int}~{int}的結束行號
  const [singleLineInput, setSingleLineInput] = useState(''); // 用於單一{int}輸入
  const [textInput, setTextInput] = useState(''); // 用於{String}類型的文字輸入

  const [chatLog, setChatLog] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [model, setModel] = useState('llama3');
  const [character, setCharacter] = useState('CodingExpert');
  const [showModal, setShowModal] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const chatLogRef = useRef(null);

  // 設定語言模型
  const handleModel = (model) => {
    setModel(model);
    localStorage.setItem('selectedModel', model);
  };

  // 設定角色
  const handleCharacter = (character) => {
    setCharacter(character);
    localStorage.setItem('selectedCharacter', character);
  };

  const handleModal = (showModal) => {
    setShowModal(prevShowModal => !prevShowModal);
  };

  // 刪除所有對話
  const clearChatLog = () => {
    localStorage.removeItem('chatLog');
    setChatLog(defaultChat);
    handleModal(false); // 關閉警示框
  };

  // 載入對話紀錄和設定
  useEffect(() => {
    const chatHistory = JSON.parse(localStorage.getItem('chatLog')) || defaultChat;
    const currentTime = new Date().getTime();
    const filteredChatHistory = chatHistory.filter(message => !message.expiration || message.expiration > currentTime);
    setChatLog(filteredChatHistory.length ? filteredChatHistory : defaultChat);
    localStorage.setItem('chatLog', JSON.stringify(filteredChatHistory));

    const savedModel = localStorage.getItem('selectedModel');
    const savedCharacter = localStorage.getItem('selectedCharacter');
    if (savedModel) setModel(savedModel);
    if (savedCharacter) setCharacter(savedCharacter);
  }, []);

  useEffect(() => {
    chatLog.forEach((message, index) => {
      if (message.role === 'assistant' && message.hasAddCodeButton) {
        const element = document.getElementById(`message-${index}`);
        if (element) {
          // 對每個 <pre><code> 元素進行高亮顯示並添加複製按鈕
          element.querySelectorAll('pre code').forEach((block, blockIndex) => {
            hljs.highlightElement(block);

            // 為每個代碼塊創建一個獨立的複製按鈕組件
            const CopyButton = () => {
              const [isCopied, setIsCopied] = useState(false);

              const handleCopy = () => {
                navigator.clipboard.writeText(block.innerText)
                  .then(() => {
                    setIsCopied(true);
                    setTimeout(() => setIsCopied(false), 2000);
                  })
                  .catch(err => console.error('複製失敗', err));
              };

              return (
                <IconButton
                  aria-label="copy"
                  size="small"
                  onClick={handleCopy}
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    backgroundColor: 'transparent',
                  }}
                >
                  {isCopied ?
                    <CheckIcon fontSize="inherit" style={{ color: '#4CAF50' }} /> :
                    <ContentCopyIcon fontSize="inherit" />
                  }
                </IconButton>
              );
            };

            // 創建容器並設置定位
            const preBlock = block.closest('pre');
            if (preBlock) {
              preBlock.style.position = 'relative';

              // 創建「加進程式碼」按鈕
              const AddCodeButton = () => {
                  const handleAddCode = async () => {
                      try {
                          await addCodeToIndexedDB(block.innerText, message.positionRow); // 替換指定行
                      } catch (error) {
                          console.error('無法替代程式碼：', error);
                      }
                  };

                  return (
                      <button
                          style={{
                              marginTop: '8px',
                              display: 'block',
                              backgroundColor: '#4CAF50',
                              color: 'white',
                              border: 'none',
                              padding: '5px 10px',
                              cursor: 'pointer',
                              borderRadius: '4px',
                          }}
                          onClick={handleAddCode}
                      >
                          加進程式碼
                      </button>
                  );
              };

              // 創建新的容器元素
              const copyButtonContainer = document.createElement('div');
              copyButtonContainer.id = `copy-button-${index}-${blockIndex}`;
              preBlock.appendChild(copyButtonContainer);

              // 渲染複製按鈕組件
              ReactDOM.render(
                <CopyButton />,
                copyButtonContainer
              );

              // 創建按鈕容器
              const buttonContainer = document.createElement('div');
              buttonContainer.style.marginTop = '8px';
              buttonContainer.id = `add-button-${index}-${blockIndex}`;

              // 添加到 preBlock
              preBlock.appendChild(buttonContainer);

              // 渲染按鈕
              ReactDOM.render(<AddCodeButton />, buttonContainer);
            }
          });
        }
      }

      // 滾動到最新消息
      const current = chatLogRef.current;
      if (current) {
        current.scrollTo({ top: current.scrollHeight, behavior: 'smooth' });
      }
    });
    return () => {
      chatLog.forEach((message, index) => {
        const element = document.getElementById(`message-${index}`);
        if (element) {
          element.querySelectorAll('pre').forEach((pre, blockIndex) => {
            const container = document.getElementById(`copy-button-${index}-${blockIndex}`);
            const container2 = document.getElementById(`add-button-${index}-${blockIndex}`);
            if (container) {
              ReactDOM.unmountComponentAtNode(container);
            }
            if (container2) {
              ReactDOM.unmountComponentAtNode(container2);
            }
          });
        }
      });
    };
  }, [chatLog]);

  useEffect(() => {
      const handlePythonEditorResponse = (event) => {
          const { userMessage, aiResponse, time, positionRow } = event.detail;

          // 新增對話記錄，包含行數
          const updatedChatLog = [
              ...chatLog,
              { role: 'user', content: userMessage, time },
              { 
                  role: 'assistant', 
                  content: aiResponse, 
                  time, 
                  positionRow, // 傳遞行數
                  hasAddCodeButton: true, // 標記需要[加進程式碼]按鈕
                  hasCommentButton: true // 標記需要[註解此行]按鈕
              },
          ];
          setChatLog(updatedChatLog);
          saveChatLog(updatedChatLog);
      };

      window.addEventListener('pythonEditorResponse', handlePythonEditorResponse);

      return () => {
          window.removeEventListener('pythonEditorResponse', handlePythonEditorResponse);
      };
  }, [chatLog]);

  const getCodeFromIndexedDB = async (startLine, endLine) => {
    return new Promise((resolve, reject) => {
      const openRequest = indexedDB.open('codeDatabase', 1);

      openRequest.onsuccess = function (event) {
        const db = event.target.result;
        const transaction = db.transaction(['codeStore'], 'readonly');
        const store = transaction.objectStore('codeStore');
        const getRequest = store.get('python_code');

        getRequest.onsuccess = function () {
          if (getRequest.result) {
            const codeLines = getRequest.result.code.split('\n');
            const selectedCode = codeLines.slice(startLine - 1, endLine).join('\n');
            resolve(selectedCode);
          } else {
            resolve('');
          }
        };

        getRequest.onerror = function () {
          console.error('Error fetching code from IndexedDB:', getRequest.error);
          reject(getRequest.error);
        };
      };

      openRequest.onerror = function (event) {
        console.error('Error opening IndexedDB:', event.target.errorCode);
        reject(event.target.errorCode);
      };
    });
  };

  const getAllCodeFromIndexedDB = async () => {
    return new Promise((resolve, reject) => {
      const openRequest = indexedDB.open('codeDatabase', 1);
  
      openRequest.onsuccess = function (event) {
        const db = event.target.result;
        const transaction = db.transaction(['codeStore'], 'readonly');
        const store = transaction.objectStore('codeStore');
        const getRequest = store.get('python_code');
  
        getRequest.onsuccess = function () {
          if (getRequest.result) {
            resolve(getRequest.result.code); // 提取所有程式碼
          } else {
            resolve(''); // 若無程式碼，回傳空字串
          }
        };
  
        getRequest.onerror = function () {
          console.error('Error fetching code from IndexedDB:', getRequest.error);
          reject(getRequest.error);
        };
      };
  
      openRequest.onerror = function (event) {
        console.error('Error opening IndexedDB:', event.target.errorCode);
        reject(event.target.errorCode);
      };
    });
  };
  
  const addCodeToIndexedDB = async (code, replaceLine = null) => {
      return new Promise((resolve, reject) => {
          const openRequest = indexedDB.open('codeDatabase', 1);

          openRequest.onupgradeneeded = function (event) {
              const db = event.target.result;
              if (!db.objectStoreNames.contains('codeStore')) {
                  db.createObjectStore('codeStore', { keyPath: 'id' });
              }
          };

          openRequest.onsuccess = function (event) {
              const db = event.target.result;
              const transaction = db.transaction(['codeStore'], 'readwrite');
              const store = transaction.objectStore('codeStore');

              const getRequest = store.get('python_code');
              getRequest.onsuccess = function () {
                  const existingCode = getRequest.result ? getRequest.result.code : '';
                  let updatedCode = existingCode;

                  if (replaceLine !== null) {
                      // 確保程式碼有足夠的行數
                      const lines = existingCode.split('\n');
                      while (lines.length < replaceLine) {
                          lines.push(''); // 填充空行
                      }
                      lines[replaceLine - 1] = code; // 替換指定行
                      updatedCode = lines.join('\n');
                  } else {
                      updatedCode = existingCode + '\n' + code; // 附加程式碼
                  }

                  // 更新到 IndexedDB
                  const putRequest = store.put({ id: 'python_code', code: updatedCode });
                  putRequest.onsuccess = function () {
                      // 觸發事件通知更新
                      window.dispatchEvent(new CustomEvent('newCodeAdd', {
                          detail: {
                              code: updatedCode,
                              source: 'addCodeToIndexedDB'
                          }
                      }));
                      resolve();
                  };
                  putRequest.onerror = function (error) {
                      console.error('儲存程式碼時發生錯誤:', error);
                      reject(error);
                  };
              };

              getRequest.onerror = function (error) {
                  console.error('獲取現有程式碼時發生錯誤:', error);
                  reject(error);
              };
          };

          openRequest.onerror = function (error) {
              console.error('無法打開 IndexedDB:', error);
              reject(error);
          };
      });
  };


  const saveChatLog = (chatLog) => {
    const expirationTime = new Date();
    expirationTime.setDate(expirationTime.getDate() + 14);

    const chatLogWithExpiration = chatLog.map(message => ({
      ...message,
      expiration: message.expiration || expirationTime.getTime()
    }));

    if (chatLogWithExpiration.length > 30) {
      chatLogWithExpiration.splice(0, chatLogWithExpiration.length - 30);
    }

    localStorage.setItem('chatLog', JSON.stringify(chatLogWithExpiration));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const trimmedUserInput = userInput.trim();
    if (!trimmedUserInput) return;

    const currentTime = new Date().toLocaleTimeString('it-IT');
    const newChatLog = [
      ...chatLog,
      { role: 'user', content: trimmedUserInput, time: currentTime },
      { role: 'assistant', content: 'loading' }
    ];
    setChatLog(newChatLog);
    saveChatLog(newChatLog);

    const requestBody = {
      chatLog: newChatLog.filter(message => message.role !== 'assistant' || message.content !== 'loading'),
      selectedCharacter: character,
      model: model
    };

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestBody)
      });
      const data = await response.json();
      const airesponse = data.airesponse;

      const updatedChatLog = [
        ...chatLog,
        { role: 'user', content: trimmedUserInput, time: currentTime },
        { role: 'assistant', content: airesponse }
      ];
      setChatLog(updatedChatLog);
      saveChatLog(updatedChatLog);
    } catch (error) {
      console.error("Error:", error);
      const updatedChatLog = [
        ...chatLog,
        { role: 'user', content: trimmedUserInput, time: currentTime },
        { role: 'assistant', content: 'Error: Unable to fetch response.' }
      ];
      setChatLog(updatedChatLog);
      saveChatLog(updatedChatLog);
    }
    setUserInput('');
  };

  // 泡泡按鈕點擊處理
  const handleBubbleClick = (question) => {
    if (question.fullText.includes("{int}~{int}")) {
      setShowInputFields({ type: "range", fullText: question.fullText });
    } else if (question.fullText.includes("{int}")) {
      setShowInputFields({ type: "singleInt", fullText: question.fullText });
    } else if (question.label === "解釋") {
      sendQuestionToAI(question.fullText, true); // 包含所有程式碼的請求
    } else {
      sendQuestionToAI(question.fullText);
    }
  };

  // 修改確認輸入的函數，不再使用按鈕，而是在點擊容器時發送
  const confirmInputOnContainerClick = async () => {
    if (showInputFields?.type === 'range' && startLine && endLine) {
      const filledText = showInputFields.fullText.replace('{int}~{int}', `${startLine}~${endLine}`);
      await sendQuestionToAI(filledText); // 傳送包含行數範圍的問題
      resetInputs();
    } else if (showInputFields?.type === 'singleInt' && singleLineInput) {
      const filledText = showInputFields.fullText.replace('{int}', singleLineInput);
      await sendQuestionToAI(filledText, true); // 傳送包含單行的問題
      resetInputs();
    } else if (showInputFields?.type === 'string' && textInput) {
      const filledText = showInputFields.fullText.replace('{String}', textInput);
      await sendQuestionToAI(filledText);
      resetInputs();
    }
  };

  const handleCommentLine = (lineNumber) => {
      window.dispatchEvent(new CustomEvent('addCommentToLine', {
          detail: { lineNumber }
      }));
  };

  const resetInputs = () => {
    setShowInputFields(null);
    setStartLine('');
    setEndLine('');
    setSingleLineInput('');
    setTextInput('');
  };

  // 發送請求的函數
  const sendQuestionToAI = async (content, includeAllCode = false) => {
    const currentTime = new Date().toLocaleTimeString('it-IT');
  
    let extractedCode = '';
  
    if (includeAllCode) {
      if (showInputFields?.type === 'singleInt') {
        // 提取指定行的程式碼
        const lineNum = parseInt(singleLineInput, 10);
        if (!isNaN(lineNum)) {
          extractedCode = await getCodeFromIndexedDB(lineNum, lineNum); // 單行程式碼
          extractedCode += '\n以下是全部程式碼：\n' + await getAllCodeFromIndexedDB();
        }
      }
      else{
        // 提取所有程式碼
        extractedCode = await getAllCodeFromIndexedDB();
      }
    } else if (showInputFields?.type === 'range') {
      // 提取範圍內的程式碼
      const startLineNum = parseInt(startLine, 10);
      const endLineNum = parseInt(endLine, 10);
      if (!isNaN(startLineNum) && !isNaN(endLineNum)) {
        extractedCode = await getCodeFromIndexedDB(startLineNum, endLineNum);
      }
    } 
    // else if (showInputFields?.type === 'singleInt') {
    //   // 提取指定行的程式碼
    //   const lineNum = parseInt(singleLineInput, 10);
    //   if (!isNaN(lineNum)) {
    //     extractedCode = await getCodeFromIndexedDB(lineNum, lineNum); // 單行程式碼
    //   }
    // }
  
    // 用於顯示的內容
    const displayContent = content;
  
    // 實際發送的完整內容
    const fullContent = extractedCode
      ? `${content}\n以下是提取的程式碼：\n${extractedCode}`
      : content;
  
    // 更新聊天室（僅顯示用戶的指令）
    const newChatLog = [
      ...chatLog,
      { role: 'user', content: displayContent, time: currentTime }, // 顯示簡單指令
      { role: 'assistant', content: 'loading' } // 加載狀態
    ];
  
    setChatLog(newChatLog);
    saveChatLog(newChatLog);
  
    // 發送包含完整內容的請求
    const requestBody = {
      chatLog: [
        ...chatLog,
        { role: 'user', content: fullContent, time: currentTime } // 發送完整內容
      ],
      selectedCharacter: character,
      model: model
    };
  
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
      const data = await response.json();
      const airesponse = data.airesponse;
  
      // 更新聊天室，顯示 AI 回應
      const updatedChatLog = [
        ...chatLog,
        { role: 'user', content: displayContent, time: currentTime }, // 保持用戶顯示內容
        { role: 'assistant', content: airesponse }
      ];
      setChatLog(updatedChatLog);
      saveChatLog(updatedChatLog);
    } catch (error) {
      console.error('Error:', error);
      const updatedChatLog = [
        ...chatLog,
        { role: 'user', content: displayContent, time: currentTime },
        { role: 'assistant', content: 'Error: Unable to fetch response.' }
      ];
      setChatLog(updatedChatLog);
      saveChatLog(updatedChatLog);
    }
  };
  

  return (
    <div className={styles.container}>
      <div className={styles.titleContainer}>
        <DropDownMenu character={character} model={model} countTrueValues={countTrueValues} onGetModel={handleModel} onGetCharacter={handleCharacter} onGetShowModal={handleModal} />
      </div>

      <div id={styles.chatlog} ref={chatLogRef} style={{ width: '100%' }}>
        {chatLog.map((content, index) => (
          <div key={index} className={`${styles[`${content.role}ReplyContainer`]}`}>
            {content.role === 'assistant' && (
              <div>
                <Image src="/myblock3c/AIchat/media/robot.jpg" width={30} height={30} className={styles.characterImg} alt="robot" />
                <p className={styles.characterName}>AI-robot</p>
              </div>
            )}
            <div className={`${styles[`${content.role}Reply`]} ${styles.chatCard}`}>
                {content.content === 'loading' ? (
                    <div className={styles.loadingIcon}>
                        <FontAwesomeIcon icon={faSpinner} spin />
                    </div>
                ) : (
                    <>
                        <pre className={styles.message} id={`message-${index}`} dangerouslySetInnerHTML={{ __html: content.content }} style={{ width: '100%', whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}></pre>
                        {content.hasCommentButton && (
                            <button
                                onClick={() => handleCommentLine(content.positionRow)} // 點擊後呼叫函數
                                style={{
                                    marginTop: '8px',
                                    display: 'block',
                                    backgroundColor: '#4CAF50',
                                    color: 'white',
                                    border: 'none',
                                    padding: '5px 10px',
                                    cursor: 'pointer',
                                    borderRadius: '4px',
                                }}
                            >
                                註解此行
                            </button>
                        )}
                    </>
                )}
            </div>
            {content.time && <div className={styles.time}>{content.time}</div>}
          </div>
        ))}
      </div>

      {/* 預設問題泡泡 */}
      <div className={styles.bubbleContainer}>
        {defaultQuestions.map((question, index) => (
          <button
            key={index}
            className={styles.bubbleButton}
            onClick={() => handleBubbleClick(question)}
          >
            {question.label}
          </button>
        ))}
      </div>

      {/* 行號輸入框 */}
      {showInputFields && (
        <div className={styles.lineInputContainer} onClick={confirmInputOnContainerClick}>
          {showInputFields.type === "range" && (
            <>
              <input
                type="number"
                placeholder="數字"
                value={startLine}
                onChange={(e) => setStartLine(e.target.value)}
                className={styles.lineInput}
              />
              <input
                type="number"
                placeholder="數字"
                value={endLine}
                onChange={(e) => setEndLine(e.target.value)}
                className={styles.lineInput}
              />
            </>
          )}
          {showInputFields.type === "singleInt" && (
            <input
              type="number"
              placeholder="數字"
              value={singleLineInput}
              onChange={(e) => setSingleLineInput(e.target.value)}
              className={styles.lineInput}
            />
          )}
          {showInputFields.type === "string" && (
            <input
              type="text"
              placeholder="文字"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              className={styles.lineInput}
            />
          )}
          <FontAwesomeIcon icon={faTimes} onClick={() => setShowInputFields(null)} className={styles.cancelButton} />
        </div>
      )}

      <form id={styles.chatform} onSubmit={handleSubmit}>
        <div className={styles.formGroup}>
          <div className={styles.inputContainer}>
            <textarea
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              id={styles.userinput}
              placeholder="Type your question here..."
              style={{ resize: 'none' }}
            ></textarea>
          </div>
          <div id={styles.sendContainer}>
            <button type="submit" className={styles.send}>
              <FontAwesomeIcon icon={faPaperPlane} />
            </button>
          </div>
        </div>
      </form>

      {showModal && <Modal showModal={showModal} onConfirm={clearChatLog} onCancel={() => setShowModal(false)} />}
    </div>
  );
}

export default ChatInterface;
