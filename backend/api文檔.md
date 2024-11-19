# MyBlock3 API 文檔

## 基本信息
- Base URL: `/myblock3/api`
- 所有需要驗證的 endpoints 都需要有效的 PHP Session（通過 PHPSESSID cookie）
- 回應格式：JSON
- 所有專案名稱在 URL 中需要進行 URL 編碼

## API Endpoints

### 獲取當前用戶信息
獲取當前登入用戶的信息。

```
GET /myblock3/whois
```

#### 成功回應 (200 OK)
```json
{
    "username": "string"
}
```

#### 錯誤回應
- **401 Unauthorized**
  ```json
  {
    "error": "No PHP Session ID found"
  }
  ```
- **401 Unauthorized**
  ```json
  {
    "error": "No session data found"
  }
  ```
- **401 Unauthorized**
  ```json
  {
    "error": "No token found in session"
  }
  ```
- **401 Unauthorized**
  ```json
  {
    "error": "User not found"
  }
  ```

### 列出所有專案
獲取當前用戶的所有專案列表。

```
GET /myblock3/api/projects
```

#### 成功回應 (200 OK)
```json
{
    "projects": [
        {
            "id": "number",
            "project_name": "string",
            "created_at": "datetime",
            "updated_at": "datetime"
        }
    ]
}
```

#### 錯誤回應
- **401 Unauthorized**
  ```json
  {
    "error": "Unauthorized",
    "redirect": "login_url"
  }
  ```

### 創建新專案
創建一個新的專案。

```
POST /myblock3/api/projects
```

#### 請求內容
```json
{
    "project_name": "string",
    "code": "string" (optional),
    "blockly_code": "string" (optional)
}
```

#### 成功回應 (200 OK)
```json
{
    "message": "Project created successfully",
    "project_id": "number"
}
```

#### 錯誤回應
- **400 Bad Request**
  ```json
  {
    "error": "Project name is required"
  }
  ```
- **400 Bad Request**
  ```json
  {
    "error": "A project with this name already exists"
  }
  ```
- **401 Unauthorized**
  ```json
  {
    "error": "Unauthorized",
    "redirect": "login_url"
  }
  ```
- **500 Internal Server Error**
  ```json
  {
    "error": "Database error message"
  }
  ```

### 獲取專案程式碼
獲取特定專案的程式碼。

```
GET /myblock3/api/projects/{project_name}/code
```

#### 路徑參數
- project_name: 專案名稱（URL 編碼）

#### 成功回應 (200 OK)
```json
{
    "code": "string",
    "blockly_code": "string"
}
```

#### 錯誤回應
- **404 Not Found**
  ```json
  {
    "error": "Project not found or unauthorized"
  }
  ```
- **401 Unauthorized**
  ```json
  {
    "error": "Unauthorized",
    "redirect": "login_url"
  }
  ```

### 更新專案名稱
修改專案名稱。

```
PUT /myblock3/api/projects/{old_project_name}/name
```

#### 路徑參數
- old_project_name: 當前專案名稱（URL 編碼）

#### 請求內容
```json
{
    "project_name": "string"  // 新的專案名稱
}
```

#### 成功回應 (200 OK)
```json
{
    "message": "Project name updated successfully"
}
```

#### 錯誤回應
- **400 Bad Request**
  ```json
  {
    "error": "New project name is required"
  }
  ```
- **400 Bad Request**
  ```json
  {
    "error": "A project with this name already exists"
  }
  ```
- **404 Not Found**
  ```json
  {
    "error": "Project not found or unauthorized"
  }
  ```
- **401 Unauthorized**
  ```json
  {
    "error": "Unauthorized",
    "redirect": "login_url"
  }
  ```

### 更新專案內容
更新專案的程式碼內容。

```
PUT /myblock3/api/projects/{project_name}/content
```

#### 路徑參數
- project_name: 專案名稱（URL 編碼）

#### 請求內容
```json
{
    "code": "string" (optional),
    "blockly_code": "string" (optional)
}
```
注意：至少需要提供 code 或 blockly_code 其中之一

#### 成功回應 (200 OK)
```json
{
    "message": "Project content updated successfully"
}
```

#### 錯誤回應
- **400 Bad Request**
  ```json
  {
    "error": "Code or blockly_code is required"
  }
  ```
- **404 Not Found**
  ```json
  {
    "error": "Project not found or unauthorized"
  }
  ```
- **401 Unauthorized**
  ```json
  {
    "error": "Unauthorized",
    "redirect": "login_url"
  }
  ```

### 刪除專案
刪除指定的專案。

```
DELETE /myblock3/api/projects/{project_name}
```

#### 路徑參數
- project_name: 專案名稱（URL 編碼）

#### 成功回應 (200 OK)
```json
{
    "message": "Project deleted successfully"
}
```

#### 錯誤回應
- **404 Not Found**
  ```json
  {
    "error": "Project not found or unauthorized"
  }
  ```
- **401 Unauthorized**
  ```json
  {
    "error": "Unauthorized",
    "redirect": "login_url"
  }
  ```

## 通用錯誤回應

### 未授權訪問
當用戶未登入或 session 已過期時：
```json
{
    "error": "Unauthorized",
    "redirect": "login_url"
}
```

### 伺服器錯誤
當發生資料庫錯誤或其他伺服器端錯誤時：
```json
{
    "error": "Error message"
}
```

## 注意事項

1. 身份驗證
   - 所有 API 請求都需要有效的 PHP Session
   - 未登入用戶會被重定向到登入頁面

2. 專案名稱
   - 專案名稱在同一用戶下必須唯一
   - 專案名稱在 URL 中需要進行 URL 編碼
   - 建議避免使用特殊字符

3. 錯誤處理
   - 所有錯誤回應都包含描述性的錯誤訊息
   - 401 錯誤會包含重定向 URL

4. 資料格式
   - 所有請求和回應的內容類型都是 application/json
   - 日期時間格式遵循 MySQL datetime 格式