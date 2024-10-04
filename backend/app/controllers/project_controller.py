from app import db
from app.models.project import Project
from flask_login import current_user

def get_user_projects():
    return Project.query.filter_by(user_id=current_user.id).all()

def add_project(project_name, code):
    project = Project(project_name=project_name, code=code, author=current_user)
    db.session.add(project)
    db.session.commit()

def delete_project(project_id):
    project = Project.query.get(project_id)
    if project and project.user_id == current_user.id:
        db.session.delete(project)
        db.session.commit()
        return True
    return False

def update_project(project_id, new_name, new_code):
    project = Project.query.get(project_id)
    if project and project.user_id == current_user.id:
        project.project_name = new_name
        project.code = new_code
        db.session.commit()
        return True
    return False
