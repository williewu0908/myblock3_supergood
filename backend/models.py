from sqlalchemy import create_engine, Column, Integer, String, Text, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from config import DB_URL

Base = declarative_base()
engine = create_engine(DB_URL)
Session = sessionmaker(bind=engine)

class User(Base):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True)
    username = Column(String(50), unique=True, nullable=False)
    projects = relationship("Project", back_populates="user")

class Project(Base):
    __tablename__ = 'projects'

    id = Column(Integer, primary_key=True)
    project_name = Column(String(100), nullable=False)
    json_code = Column(Text, nullable=False)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    user = relationship("User", back_populates="projects")

# 創建表
Base.metadata.create_all(engine)

def get_or_create_user(username):
    session = Session()
    user = session.query(User).filter_by(username=username).first()
    if not user:
        user = User(username=username)
        session.add(user)
        session.commit()
    session.close()
    return user

def fetch_projects(username):
    session = Session()
    user = get_or_create_user(username)
    projects = session.query(Project).filter_by(user_id=user.id).all()
    result = [project.project_name for project in projects]
    session.close()
    return result

def add_project(username, project_name, json_code):
    session = Session()
    user = get_or_create_user(username)
    new_project = Project(project_name=project_name, json_code=json_code, user_id=user.id)
    session.add(new_project)
    session.commit()
    session.close()

def delete_project(username, project_name):
    session = Session()
    user = get_or_create_user(username)
    project = session.query(Project).filter_by(user_id=user.id, project_name=project_name).first()
    if project:
        session.delete(project)
        session.commit()
    session.close()

def update_project_name(username, old_name, new_name):
    session = Session()
    user = get_or_create_user(username)
    project = session.query(Project).filter_by(user_id=user.id, project_name=old_name).first()
    if project:
        project.project_name = new_name
        session.commit()
    session.close()

def load_project(username, project_name):
    session = Session()
    user = get_or_create_user(username)
    project = session.query(Project).filter_by(user_id=user.id, project_name=project_name).first()
    result = project.json_code if project else None
    session.close()
    return result

def save_project(username, project_name, json_code):
    session = Session()
    user = get_or_create_user(username)
    project = session.query(Project).filter_by(user_id=user.id, project_name=project_name).first()
    if project:
        project.json_code = json_code
    else:
        new_project = Project(project_name=project_name, json_code=json_code, user_id=user.id)
        session.add(new_project)
    session.commit()
    session.close()
