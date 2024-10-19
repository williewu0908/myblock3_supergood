from app import db
from app.models.user import User
from flask_login import login_user, logout_user

def register_user(username, email, password):
    user = User(username=username, email=email)
    user.set_password(password)
    user.encoded_username_email = user.encode_username_email()
    db.session.add(user)
    db.session.commit()

def login_user_controller(username, password):
    user = User.query.filter_by(username=username).first()
    if user and user.check_password(password):
        login_user(user)
        user.encoded_username_email = user.encode_username_email()
        db.session.commit()
        return True, user.username, user.email
    return False, None, None

def logout_user_controller():
    logout_user()
