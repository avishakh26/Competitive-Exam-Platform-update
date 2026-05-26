import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

BASE_DIR = os.path.abspath(os.path.dirname(__file__))


class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "dsa-arena-secret-key-2026!")
    # Use DATABASE_URL from environment (Vercel/Neon), fallback to SQLite
    SQLALCHEMY_DATABASE_URI = os.environ.get("DATABASE_URL", "sqlite:///" + os.path.join(BASE_DIR, "arena.db"))
    # Fix for Heroku/Neon DATABASE_URL (postgres:// -> postgresql://)
    if SQLALCHEMY_DATABASE_URI.startswith("postgres://"):
        SQLALCHEMY_DATABASE_URI = SQLALCHEMY_DATABASE_URI.replace("postgres://", "postgresql://", 1)
        
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    UPLOAD_FOLDER_PROBLEMS = os.path.join(BASE_DIR, "uploads", "problems")
    UPLOAD_FOLDER_SUBMISSIONS = os.path.join(BASE_DIR, "uploads", "submissions")

    MAX_CONTENT_LENGTH = 5 * 1024 * 1024  # 5 MB

    ALLOWED_CODE_EXTENSIONS = {".py", ".cpp", ".java", ".c"}
    ALLOWED_PDF_EXTENSIONS = {".pdf"}
