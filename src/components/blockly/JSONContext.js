import React, { createContext, useContext } from 'react';

const JSONContext = createContext();

// Provider Component
export const JSONProvider = ({ children }) => {
  const getJSON = () => {
    try {
      // 獲取當前工作區的JSON
      const json = JSON.stringify(Blockly.serialization.workspaces.save(Code.workspace), null, 2);
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
      Blockly.serialization.workspaces.load(parsedJSON, Code.workspace);
      console.log("Workspace loaded from JSON:", json);
    } catch (error) {
      console.error("Error loading workspace from JSON:", error);
    }
  };

  return (
    <JSONContext.Provider value={{ getJSON, setJSON }}>
      {children}
    </JSONContext.Provider>
  );
};

// Custom Hook
export const useJSON = () => useContext(JSONContext);
