import { useState } from 'react';
import Image from 'next/image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane, faSpinner } from '@fortawesome/free-solid-svg-icons';
import styles from './ChatInterface.module.css';

function ChatInterface() {
  const defaultChat = [
    { type: 'AI', message: '你好，有什麼需要幫助的嗎？' }
  ];

  const [chatLog, setChatLog] = useState(defaultChat);
  const [userInput, setUserInput] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();

    const trimmedUserInput = userInput.trim();
    if (!trimmedUserInput) return;

    const currentTime = new Date().toLocaleTimeString('it-IT');

    setChatLog(prevChatLog => [
      ...prevChatLog,
      { type: 'user', message: trimmedUserInput, time: currentTime },
      { type: 'AI', message: 'loading' }
    ]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ userinput: trimmedUserInput })
      });
      const data = await response.json();
      const airesponse = data.airesponse;

      setChatLog(prevChatLog => [
        ...prevChatLog.slice(0, -1),
        { type: 'AI', message: airesponse }
      ]);
    } catch (error) {
      console.error("Error:", error);
      setChatLog(prevChatLog => [
        ...prevChatLog.slice(0, -1),
        { type: 'AI', message: 'Error: Unable to fetch response.' }
      ]);
    }
    setUserInput('');
  };

  return (
    <div className={styles.container}>
      <div className={styles.titleContainer}>
        <Image src="/media/robot.jpg" width={40} height={40} className={styles.characterTitleImg} alt="robot" />
        <h1 className={styles.title}>Chat with AI</h1>
        <div className={styles.subtitle}>你的程式小助手</div>
      </div>
      <div id={styles.chatlog}>
        {chatLog.map((content, index) => (
          <div key={index} className={`${styles[`${content.type}ReplyContainer`]}`}>
            {content.type === 'AI' && (
              <div>
                <Image src="/media/robot.jpg" width={30} height={30} className={styles.characterImg} alt="robot" />
                <p className={styles.characterName}>AI-robot</p>
              </div>
            )}
            <div className={`${styles[`${content.type}Reply`]} ${styles.chatCard}`}>
              {content.message === 'loading' ? (
                <div className={styles.loadingIcon}>
                  <FontAwesomeIcon icon={faSpinner} spin />
                </div>
              ) : (
                content.message
              )}
            </div>
            {content.time && <div className={styles.time}>{content.time}</div>}
          </div>
        ))}
      </div>
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
    </div>
  );
}

export default ChatInterface;
