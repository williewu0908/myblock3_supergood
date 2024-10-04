import React, { createContext, useContext, useRef } from 'react';
import BlocklyComponent from './BlocklyComponent'; // 引入 BlocklyComponent


const JSONContext = createContext();

// Provider Component
export const JSONProvider = ({ children }) => {
  const BlocklyRef = useRef(); // 用於存儲 BlocklyComponent 的引用
  const getJSON = () => {
    try {
      // 獲取當前工作區的JSON
      const json = BlocklyRef.current.saveCode();

      console.log("Workspace JSON:", json);
      return json;
    } catch (error) {
      console.error("Error getting workspace JSON:", error);
      return null;
    }
  };

  const setJSON = (json) => {
    try {
      // 將json加載回工作區
      const parsedJSON = JSON.parse(json);
      BlocklyRef.current.loadCode(parsedJSON);
      console.log("Workspace loaded from JSON:", json);
    } catch (error) {
      console.error("Error loading workspace from JSON:", error);
    }
  };

  return (
    <JSONContext.Provider value={{ getJSON, setJSON }}>
      <BlocklyComponent ref={BlocklyRef} /> {/* 傳入ref */}
      {children}
    </JSONContext.Provider>
  );
};

// Custom Hook
export const useJSON = () => useContext(JSONContext);
