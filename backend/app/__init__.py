from flask import Flask
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_login import LoginManager
from .config import Config

db = SQLAlchemy()
bcrypt = Bcrypt()
login_manager = LoginManager()

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}}, supports_credentials=True)

    db.init_app(app)
    bcrypt.init_app(app)
    login_manager.init_app(app)

    # 添加這個 user_loader 裝飾器
    @login_manager.user_loader
    def load_user(user_id):
        from .models.user import User  # 避免循環導入
        return User.query.get(int(user_id))

    from .views import auth, project
    app.register_blueprint(auth.bp)
    app.register_blueprint(project.bp)

    return app
