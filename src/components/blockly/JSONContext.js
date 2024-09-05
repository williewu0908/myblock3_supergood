import React, { createContext, useContext } from 'react';

const JSONContext = createContext();

// Provider Component
export const JSONProvider = ({ children }) => {
  const getJSON = () => {
    const json = JSON.stringify(Blockly.serialization.workspaces.save(Code.workspace), null, 2);
    console.log(json);
    return json;
  };

  return (
    <JSONContext.Provider value={{ getJSON }}>
      {children}
    </JSONContext.Provider>
  );
};

// Custom Hook
export const useJSON = () => useContext(JSONContext);
