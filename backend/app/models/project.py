from app import db

class Project(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    project_name = db.Column(db.String(100), nullable=False)
    code = db.Column(db.Text, nullable=False)
    blockly_code = db.Column(db.Text, nullable=False)  # 新增的欄位
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)