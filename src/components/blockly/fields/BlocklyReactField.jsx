import React from 'react';
import ReactDOM from 'react-dom';

import * as Blockly from 'blockly/core';

// 定義一個新的 Blockly 字段類，名為 BlocklyReactField，它擴展了 Blockly.Field 類。
class BlocklyReactField extends Blockly.Field {
  // 設置該字段為可序列化，這意味著字段的值可以保存到 XML 並稍後重新加載。
  SERIALIZABLE = true;

  // fromJson 是一個靜態方法，用於從 JSON 創建 BlocklyReactField 對象。
  // `options` 是 Blockly 語句中配置該字段的 JSON 對象。
  static fromJson(options) {
    // `this` 可能是 BlocklyReactField 的子類，確保該方法可以被子類重寫。
    return new this(options['text']);
  }

  // 當字段編輯器被顯示時，調用這個方法來渲染編輯器。
  showEditor_() {
    // `this.div_` 是編輯器的容器，使用 Blockly 提供的下拉框內容區域。
    this.div_ = Blockly.DropDownDiv.getContentDiv();

    // 使用 ReactDOM 渲染 React 組件 FieldRenderComponent 到 `this.div_` 容器中。
    ReactDOM.render(this.render(), this.div_);

    // 根據當前 Blockly 塊的顏色來設置下拉框的邊框顏色。
    var border = this.sourceBlock_.style.colourTertiary;
    border = border.colourBorder || border.colourLight;
    Blockly.DropDownDiv.setColour(this.sourceBlock_.getColour(), border);

    // 使用 Blockly 的下拉框顯示機制來定位編輯器。
    // 當下拉框消失時，調用 `this.dropdownDispose_` 方法。
    Blockly.DropDownDiv.showPositionedByField(
      this,
      this.dropdownDispose_.bind(this),
    );
  }

  // 當下拉框被關閉時，這個方法會被調用來卸載 React 組件，防止內存洩漏。
  dropdownDispose_() {
    // 卸載渲染在 `this.div_` 容器中的 React 組件。
    ReactDOM.unmountComponentAtNode(this.div_);
  }

  // 渲染方法，返回 React 組件。該組件會在 `showEditor_` 中渲染到下拉框中。
  render() {
    return <FieldRenderComponent />;
  }
}

// 定義一個 React 組件，這個組件將作為 Blockly 字段的編輯器顯示。
// 該組件在 render() 方法中返回一個簡單的 div，顯示文字 "Hello from React!"。
class FieldRenderComponent extends React.Component {
  render() {
    return <div style={{color: '#fff'}}>Hello from React!</div>;
  }
}

// 將自定義字段 BlocklyReactField 註冊到 Blockly 的字段註冊表中。
// 名稱為 'field_react_component'，這樣在使用該字段時可以通過這個名稱引用。
// Blockly.fieldRegistry.register('field_react_component', BlocklyReactField);

// 將 BlocklyReactField 作為默認導出，讓其他文件可以導入和使用這個類。
export default BlocklyReactField;
