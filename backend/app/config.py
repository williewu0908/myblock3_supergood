import os

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'myblock-secret-key'
    SQLALCHEMY_DATABASE_URI = 'sqlite:///myblock3.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SESSION_PROTECTION = 'strong'