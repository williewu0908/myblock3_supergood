import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import ChatWithAI from "../components/chatAI/ChatWithAI";
import DevNavBar from "../components/dev-components/dev-nav";
import CodeEditor from '../components/dev-components/code-editor';
import { JSONProvider } from "../components/blockly/JSONContext";

export default function Index() {
  const [viewState, setViewState] = useState({
    Blockly: true,
    FlowChart: true,
    Code: true,
    ChatToggle: true,
  });
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const username = localStorage.getItem('username');
      const email = localStorage.getItem('email');
      const encoded_data = localStorage.getItem('encoded_data');

      if (!username || !email || !encoded_data) {
        router.push('/login');
        return;
      }

      try {
        const response = await fetch('http://127.0.0.1:5000/auth/check-auth', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username, email, encoded_data }),
        });

        if (response.status === 401) {
          router.push('/login');
        } else if (!response.ok) {
          throw new Error('Network response was not ok');
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
        router.push('/login');
      }
    };

    checkAuth();
  }, [router]);

  const toggleViewState = (newState) => {
    setViewState(newState);
  };

  return (
    <div className="container">
      <JSONProvider>
        <ChatWithAI viewState={viewState} />
        <DevNavBar toggleViewState={toggleViewState} />
        <CodeEditor viewState={viewState} />
      </JSONProvider>
    </div>
  );
}
