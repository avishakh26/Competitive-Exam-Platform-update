from datetime import datetime, timezone
from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()


# ---------------------------------------------------------------------------
# User
# ---------------------------------------------------------------------------
class User(UserMixin, db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), nullable=False)
    student_id = db.Column(db.String(40), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    total_score = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    submissions = db.relationship("Submission", backref="user", lazy=True)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def __repr__(self):
        return f"<User {self.username}>"


# ---------------------------------------------------------------------------
# Problem
# ---------------------------------------------------------------------------
class Problem(db.Model):
    __tablename__ = "problems"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    difficulty = db.Column(db.String(10), nullable=False)  # Easy / Medium / Hard
    points = db.Column(db.Integer, nullable=False)
    pdf_path = db.Column(db.String(300), nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    submissions = db.relationship("Submission", backref="problem", lazy=True)

    def __repr__(self):
        return f"<Problem {self.title}>"


# ---------------------------------------------------------------------------
# Submission
# ---------------------------------------------------------------------------
class Submission(db.Model):
    __tablename__ = "submissions"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    problem_id = db.Column(db.Integer, db.ForeignKey("problems.id"), nullable=False)
    code = db.Column(db.Text, nullable=True)
    file_path = db.Column(db.String(300), nullable=True)
    status = db.Column(db.String(20), nullable=False, default="Pending")
    feedback = db.Column(db.Text, nullable=True)
    timestamp = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def __repr__(self):
        return f"<Submission {self.id} [{self.status}]>"


# ---------------------------------------------------------------------------
# Admin
# ---------------------------------------------------------------------------
class Admin(db.Model):
    __tablename__ = "admins"

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)


