from app import db, bcrypt
from flask_login import UserMixin
from cryptography.fernet import Fernet
import base64
from datetime import date

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128))
    encoded_username = db.Column(db.String(255), unique=True, nullable=True)
    projects = db.relationship('Project', backref='author', lazy='dynamic')

    def set_password(self, password):
        self.password_hash = bcrypt.generate_password_hash(password).decode('utf-8')

    def check_password(self, password):
        return bcrypt.check_password_hash(self.password_hash, password)

    @staticmethod
    def generate_key():
        today = date.today().strftime("%Y%m%d")
        return base64.urlsafe_b64encode(today.encode().ljust(32)[:32])

    def encode_username_email(self):
        key = self.generate_key()
        f = Fernet(key)
        data = f"{self.username}+{self.email}".encode()
        return f.encrypt(data).decode()

    @staticmethod
    def verify_encoded_data(username, email, encoded_data):
        key = User.generate_key()
        f = Fernet(key)
        try:
            decrypted_data = f.decrypt(encoded_data.encode()).decode()
            print('解密過後的資料')
            return decrypted_data == f"{username}+{email}"
        except:
            return False