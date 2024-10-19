# MyBlock3 API 文檔

## 基本信息

- 基礎 URL: `http://localhost:5000` (假設在本地運行)
- 所有請求和響應均使用 JSON 格式
- 除了註冊和登錄外,所有請求都需要包含認證信息

## 認證 (Auth)

### 1. 註冊

- **URL**: `/auth/register`
- **方法**: POST
- **描述**: 註冊新用戶
- **請求格式**:
  ```json
  {
    "username": "newuser",
    "email": "newuser@example.com",
    "password": "securepassword123"
  }
  ```
- **成功響應**: 
  - 狀態碼: 201
  - 內容: `{"message": "User registered successfully"}`

### 2. 登錄

- **URL**: `/auth/login`
- **方法**: POST
- **描述**: 用戶登錄
- **請求格式**:
  ```json
  {
    "username": "existinguser",
    "password": "correctpassword123"
  }
  ```
- **成功響應**: 
  - 狀態碼: 200
  - 內容:
    ```json
    {
      "message": "Logged in successfully",
      "username": "existinguser",
      "email": "existinguser@example.com",
      "encoded_data": "encrypted_string_here"
    }
    ```

### 3. 檢查認證

- **URL**: `/auth/check-auth`
- **方法**: POST
- **描述**: 檢查用戶是否已認證
- **請求格式**:
  ```json
  {
    "username": "existinguser",
    "email": "existinguser@example.com",
    "encoded_data": "encrypted_string_from_login"
  }
  ```
- **成功響應**: 
  - 狀態碼: 200
  - 內容: `{"authenticated": true, "user": "existinguser"}`

### 4. 登出

- **URL**: `/auth/logout`
- **方法**: POST
- **描述**: 用戶登出
- **請求格式**: 不需要
- **成功響應**: 
  - 狀態碼: 200
  - 內容: `{"message": "Logged out successfully"}`

## 專案 (Projects)

注意: 所有專案相關的請求都需要包含認證信息。

### 1. 列出專案

- **URL**: `/project/list`
- **方法**: POST
- **描述**: 獲取用戶的所有專案
- **請求格式**:
  ```json
  {
    "username": "existinguser",
    "email": "existinguser@example.com",
    "encoded_data": "encrypted_string_from_login"
  }
  ```
- **成功響應**: 
  - 狀態碼: 200
  - 內容:
    ```json
    [
      {"id": 1, "name": "Project 1"},
      {"id": 2, "name": "Project 2"}
    ]
    ```

### 2. 添加專案

- **URL**: `/project/add`
- **方法**: POST
- **描述**: 添加新專案
- **請求格式**:
  ```json
  {
    "username": "existinguser",
    "email": "existinguser@example.com",
    "encoded_data": "encrypted_string_from_login",
    "projectname": "New Project",
    "code": "console.log('Hello, World!');",
    "blockly_code": "<xml>...</xml>"
  }
  ```
- **成功響應**: 
  - 狀態碼: 201
  - 內容: `{"message": "Project added successfully"}`

### 3. 刪除專案

- **URL**: `/project/delete/<project_id>`
- **方法**: POST
- **描述**: 刪除指定的專案
- **請求格式**:
  ```json
  {
    "username": "existinguser",
    "email": "existinguser@example.com",
    "encoded_data": "encrypted_string_from_login"
  }
  ```
- **成功響應**: 
  - 狀態碼: 200
  - 內容: `{"message": "Project deleted successfully"}`

### 4. 更新專案

- **URL**: `/project/update/<project_id>`
- **方法**: POST
- **描述**: 更新指定的專案
- **請求格式**:
  ```json
  {
    "username": "existinguser",
    "email": "existinguser@example.com",
    "encoded_data": "encrypted_string_from_login",
    "projectname": "Updated Project Name",
    "code": "console.log('Updated code');",
    "blockly_code": "<xml>Updated Blockly XML</xml>"
  }
  ```
- **成功響應**: 
  - 狀態碼: 200
  - 內容: `{"message": "Project updated successfully"}`

## 錯誤響應

所有 API 在遇到錯誤時會返回適當的 HTTP 狀態碼和錯誤信息。例如:

- 未授權: 
  - 狀態碼: 401
  - 內容: `{"error": "Unauthorized"}`
- 無效輸入: 
  - 狀態碼: 400
  - 內容: `{"error": "Invalid input"}`
- 資源未找到: 
  - 狀態碼: 404
  - 內容: `{"error": "Project not found or unauthorized"}`

## 注意事項

1. 所有與專案相關的操作都需要先進行用戶認證。
2. `encoded_data` 是在登錄時獲得的加密字符串,用於後續請求的認證。
3. 請確保在每次請求中都包含最新的 `encoded_data`。
