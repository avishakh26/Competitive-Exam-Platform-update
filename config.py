import os

BASE_DIR = os.path.abspath(os.path.dirname(__file__))


class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "dsa-arena-secret-key-2026!")
    SQLALCHEMY_DATABASE_URI = "sqlite:///" + os.path.join(BASE_DIR, "arena.db")
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    UPLOAD_FOLDER_PROBLEMS = os.path.join(BASE_DIR, "uploads", "problems")
    UPLOAD_FOLDER_SUBMISSIONS = os.path.join(BASE_DIR, "uploads", "submissions")

    MAX_CONTENT_LENGTH = 5 * 1024 * 1024  # 5 MB

    ALLOWED_CODE_EXTENSIONS = {".py", ".cpp", ".java", ".c"}
    ALLOWED_PDF_EXTENSIONS = {".pdf"}
