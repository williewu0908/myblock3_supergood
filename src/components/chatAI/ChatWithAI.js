import { useState } from 'react';
import ChatInterface from './ChatInterface/ChatInterface';
import ToggleButton from './ToggleButton/ToggleButton';
import styles from './ChatWithAI.module.css';

function ChatWithAI() {
  const [showChat, setShowChat] = useState(false);

  const toggleChat = () => {
    setShowChat(prevShowChat => !prevShowChat);
  };

  return (
    <div className={styles.buttonChatContainer}>
      <div className={styles.buttonContainer}>
        <ToggleButton showChat={showChat} toggleChat={toggleChat}/>
      </div>
      <div className={`${styles.chatInterfaceContainer} ${showChat ? styles.show : styles.hide}`}>
        <ChatInterface/>
      </div>
    </div>
  );
}

export default ChatWithAI;
