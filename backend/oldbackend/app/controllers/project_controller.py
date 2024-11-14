from app import db
from app.models.project import Project
from app.models.user import User

def get_user_projects(username):
    user = User.query.filter_by(username=username).first()
    if user:
        return Project.query.filter_by(user_id=user.id).all()
    return []

def add_project(username, project_name, code, blockly_code):
    user = User.query.filter_by(username=username).first()
    if user:
        project = Project(project_name=project_name, code=code, blockly_code=blockly_code, author=user)
        db.session.add(project)
        db.session.commit()

def delete_project(username, project_id):
    user = User.query.filter_by(username=username).first()
    project = Project.query.get(project_id)
    if user and project and project.user_id == user.id:
        db.session.delete(project)
        db.session.commit()
        return True
    return False

def update_project(username, project_id, new_name, new_code, new_blockly_code):
    user = User.query.filter_by(username=username).first()
    project = Project.query.get(project_id)
    if user and project and project.user_id == user.id:
        project.project_name = new_name
        project.code = new_code
        project.blockly_code = new_blockly_code
        db.session.commit()
        return True
    return False
