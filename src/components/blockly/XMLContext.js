import React, { createContext, useContext, useRef } from 'react';
import BlocklyComponent from './BlocklyComponent'; // 引入 BlocklyComponent


const XMLContext = createContext();

// Provider Component
export const XMLProvider = ({ children }) => {
  const BlocklyRef = useRef(); // 用於存儲 BlocklyComponent 的引用
  const getXML = () => {
    try {
      // 獲取當前工作區的JSON
      const xml = BlocklyRef.current.saveCode();

      console.log("Workspace XML:", xml);
      return xml;
    } catch (error) {
      console.error("Error getting workspace XML:", error);
      return null;
    }
  };

  const setXML = (xml) => {
    try {
      // 將xml加載回工作區
      BlocklyRef.current.loadCode(xml);
      console.log("Workspace loaded from XML:", xml);
    } catch (error) {
      console.error("Error loading workspace from xml:", error);
    }
  };

  return (
    <XMLContext.Provider value={{ getXML, setXML }}>
      <BlocklyComponent ref={BlocklyRef} /> {/* 傳入ref */}
      {children}
    </XMLContext.Provider>
  );
};

// Custom Hook
export const useXML = () => useContext(XMLContext);
