import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane, faSpinner } from '@fortawesome/free-solid-svg-icons';
import DropDownMenu from './DropDownMenu';
import styles from './ChatInterface.module.css';
import Modal from './Modal';
import hljs from 'highlight.js';
import 'highlight.js/styles/default.css';
import { faTimes } from '@fortawesome/free-solid-svg-icons'; // 新增 faTimes

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
            if (message.role === 'assistant') {
                const element = document.getElementById(`message-${index}`);
                if (element) {
                    element.querySelectorAll('pre code').forEach(block => {
                        hljs.highlightElement(block);
                    });
                }
            };
            const current = chatLogRef.current;
            if (current) {
                current.scrollTo({ top: current.scrollHeight, behavior: 'smooth' });
            }
        });
    }, [chatLog]);

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
        } else if (question.fullText.includes("{String}")) {
            setShowInputFields({ type: "string", fullText: question.fullText });
        } else {
            sendQuestionToAI(question.fullText);
        }
    };

    // 修改確認輸入的函數，不再使用按鈕，而是在點擊容器時發送
    const confirmInputOnContainerClick = () => {
        if (showInputFields?.type === "range" && startLine && endLine) {
            const filledText = showInputFields.fullText.replace("{int}~{int}", `${startLine}~${endLine}`);
            sendQuestionToAI(filledText);
            resetInputs();
        } else if (showInputFields?.type === "singleInt" && singleLineInput) {
            const filledText = showInputFields.fullText.replace("{int}", singleLineInput);
            sendQuestionToAI(filledText);
            resetInputs();
        } else if (showInputFields?.type === "string" && textInput) {
            const filledText = showInputFields.fullText.replace("{String}", textInput);
            sendQuestionToAI(filledText);
            resetInputs();
        }
    };

    const resetInputs = () => {
      setShowInputFields(null);
      setStartLine('');
      setEndLine('');
      setSingleLineInput('');
      setTextInput('');
    };

    // 發送請求的函數
    const sendQuestionToAI = async (content) => {
      const currentTime = new Date().toLocaleTimeString('it-IT');
      const newChatLog = [
          ...chatLog,
          { role: 'user', content: content, time: currentTime },
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
              { role: 'user', content: content, time: currentTime },
              { role: 'assistant', content: airesponse }
          ];
          setChatLog(updatedChatLog);
          saveChatLog(updatedChatLog);
      } catch (error) {
          console.error("Error:", error);
          const updatedChatLog = [
              ...chatLog,
              { role: 'user', content: content, time: currentTime },
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
                <Image src="/AIchat/media/robot.jpg" width={30} height={30} className={styles.characterImg} alt="robot" />
                <p className={styles.characterName}>AI-robot</p>
              </div>
            )}
            <div className={`${styles[`${content.role}Reply`]} ${styles.chatCard}`}>
              {content.content === 'loading' ? (
                <div className={styles.loadingIcon}>
                  <FontAwesomeIcon icon={faSpinner} spin />
                </div>
              ) : (
                <pre className={styles.message} id={`message-${index}`} dangerouslySetInnerHTML={{ __html: content.content }} style={{ width: '100%', whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}></pre>
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
