import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane, faSpinner } from '@fortawesome/free-solid-svg-icons';
import DropDownMenu from './DropDownMenu';
import styles from './ChatInterface.module.css';
import Modal from './Modal';
import hljs from 'highlight.js';
import 'highlight.js/styles/default.css';

function ChatInterface({ viewState }) {
  const countTrueValues = Object.values(viewState).filter(value => value === true).length;
  const defaultChat = [
    { role: 'assistant', content: '你好，有什麼需要幫助的嗎？' }
  ];

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
    console.log(model);
  };

  // 設定角色
  const handleCharacter = (character) => {
    setCharacter(character);
    localStorage.setItem('selectedCharacter', character);
    console.log(character);
  };

  const handleModal = (showModal) => {
    setShowModal(prevShowModal => !prevShowModal);
    console.log(`Modal open: ${showModal}`);
  };

  // 刪除所有對話
  const clearChatLog = () => {
    localStorage.removeItem('chatLog');
    setChatLog(defaultChat);
    handleModal(false); //關閉警示框
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
      //自動捲動到底部
      const current = chatLogRef.current;
      console.log(current.scrollHeight);
      if (current) {
        current.scrollTo({ top: current.scrollHeight, behavior: 'smooth' });
      }
    });
  }, [chatLog]);

  // 保存對話紀錄到localStorage
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
      <form id={styles.chatform} onSubmit={handleSubmit}>
      <div className={styles.formGroup} style={{ width: `${(1 / countTrueValues) * 100}%` }}> {/* 動態調整.formGroup的寬度*/}
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
