import os
from flask import Flask, session, redirect, url_for, flash
from flask_login import LoginManager
from flask_cors import CORS
from config import Config
from models import db, User, Admin
from decorators import admin_required  # noqa: F401 – re-exported for blueprints

def create_app():
    app = Flask(__name__)
    CORS(
        app,
        supports_credentials=True,
        origins=[
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://192.168.0.103:3000",
            "http://localhost:5173",
            "http://127.0.0.1:5173",
        ],
    )
    app.config.from_object(Config)

    # Ensure upload directories exist
    os.makedirs(app.config["UPLOAD_FOLDER_PROBLEMS"], exist_ok=True)
    os.makedirs(app.config["UPLOAD_FOLDER_SUBMISSIONS"], exist_ok=True)

    # Init extensions
    db.init_app(app)

    login_manager = LoginManager(app)
    login_manager.login_view = "auth.login"
    login_manager.login_message_category = "warning"
    login_manager.login_message = "Please log in to access this page."

    @login_manager.user_loader
    def load_user(user_id):
        return db.session.get(User, int(user_id))

    # Register blueprints
    from blueprints.auth import auth_bp
    from blueprints.user import user_bp
    from blueprints.admin import admin_bp
    from blueprints.api import api_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(user_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(api_bp)

    @app.context_processor
    def inject_rank():
        def get_user_rank(score):
            if score < 1100:
                return "Newbie", "rank-newbie"
            elif score < 2100:
                return "Pupil", "rank-pupil"
            elif score < 2500:
                return "Specialist", "rank-specialist"
            else:
                return "Master", "rank-master"
        return dict(get_user_rank=get_user_rank)


    # Create tables and seed admin on first run
    with app.app_context():
        db.create_all()
        _seed_admin()

    return app


def _seed_admin():
    """Create default admin account if none exists."""
    if Admin.query.count() == 0:
        admin = Admin(username="admin")
        admin.set_password("admin123")
        db.session.add(admin)
        db.session.commit()
        print("[OK] Default admin seeded: admin / admin123")


app = create_app()

if __name__ == "__main__":
    app.run(debug=True)


