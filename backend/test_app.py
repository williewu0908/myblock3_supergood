import unittest
from unittest.mock import patch, MagicMock
import json
import sys
sys.path.append('.')  # 確保可以導入app.py
from app import app

class FlaskAppTests(unittest.TestCase):
    def setUp(self):
        self.app = app.test_client()
        self.app.testing = True
        
    def mock_user_session(self):
        """Helper function to mock user session data"""
        return {
            'Id': 1,
            'Username': 'testuser',
            'Token_Login': 'test_token'
        }

    @patch('app.get_user_from_session')
    def test_whois(self, mock_get_user):
        """Test /whois endpoint"""
        # 設置mock返回值
        mock_get_user.return_value = (self.mock_user_session(), None)
        
        response = self.app.get('/whois')
        data = json.loads(response.data)
        
        self.assertEqual(response.status_code, 200)
        self.assertEqual(data['username'], 'testuser')

    @patch('app.get_user_from_session')
    @patch('app.mysql.connector.connect')
    def test_list_projects(self, mock_db_connect, mock_get_user):
        """Test GET /api/projects endpoint"""
        # Mock user session
        mock_get_user.return_value = (self.mock_user_session(), None)
        
        # Mock database connection and cursor
        mock_cursor = MagicMock()
        mock_cursor.fetchall.return_value = [
            {
                'id': 1,
                'project_name': 'Test Project',
                'created_at': '2024-01-01',
                'updated_at': '2024-01-01'
            }
        ]
        mock_db = MagicMock()
        mock_db.cursor.return_value = mock_cursor
        mock_db_connect.return_value = mock_db
        
        response = self.app.get('/api/projects')
        data = json.loads(response.data)
        
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(data['projects']), 1)
        self.assertEqual(data['projects'][0]['project_name'], 'Test Project')

    @patch('app.get_user_from_session')
    @patch('app.mysql.connector.connect')
    def test_create_project(self, mock_db_connect, mock_get_user):
        """Test POST /api/projects endpoint"""
        # Mock user session
        mock_get_user.return_value = (self.mock_user_session(), None)
        
        # Mock database connection and cursor
        mock_cursor = MagicMock()
        mock_cursor.fetchone.return_value = None  # 項目不存在
        mock_cursor.lastrowid = 1
        mock_db = MagicMock()
        mock_db.cursor.return_value = mock_cursor
        mock_db_connect.return_value = mock_db
        
        test_data = {
            'project_name': 'New Project',
            'code': 'print("Hello")',
            'blockly_code': '{"blocks":[]}'
        }
        
        response = self.app.post('/api/projects',
                                data=json.dumps(test_data),
                                content_type='application/json')
        data = json.loads(response.data)
        
        self.assertEqual(response.status_code, 200)
        self.assertEqual(data['project_id'], 1)

    @patch('app.get_user_from_session')
    @patch('app.mysql.connector.connect')
    def test_get_project_code(self, mock_db_connect, mock_get_user):
        """Test GET /api/projects/<project_name>/code endpoint"""
        # Mock user session
        mock_get_user.return_value = (self.mock_user_session(), None)
        
        # Mock database connection and cursor
        mock_cursor = MagicMock()
        mock_cursor.fetchone.return_value = {
            'code': 'print("Hello")',
            'blockly_code': '{"blocks":[]}'
        }
        mock_db = MagicMock()
        mock_db.cursor.return_value = mock_cursor
        mock_db_connect.return_value = mock_db
        
        response = self.app.get('/api/projects/test-project/code')
        data = json.loads(response.data)
        
        self.assertEqual(response.status_code, 200)
        self.assertEqual(data['code'], 'print("Hello")')
        self.assertEqual(data['blockly_code'], '{"blocks":[]}')

    @patch('app.get_user_from_session')
    def test_unauthorized_access(self, mock_get_user):
        """Test unauthorized access to protected endpoints"""
        # Mock未授權的session
        mock_get_user.return_value = (None, "No session data found")
        
        response = self.app.get('/api/projects')
        data = json.loads(response.data)
        
        self.assertEqual(response.status_code, 401)
        self.assertEqual(data['error'], 'Unauthorized')

    def test_generate_flowchart(self):
        """Test POST /api/flowchart endpoint"""
        test_code = """
        def test_function():
            print("Hello")
            if True:
                print("World")
        """
        
        response = self.app.post('/api/flowchart',
                            data=json.dumps({'code': test_code}),
                            content_type='application/json')
        data = json.loads(response.data)
        
        self.assertEqual(response.status_code, 200)
        self.assertTrue(data['success'])
        self.assertIn('diagramCode', data)

if __name__ == '__main__':
    unittest.main()