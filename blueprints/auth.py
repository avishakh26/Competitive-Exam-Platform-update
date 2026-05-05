from flask import (Blueprint, render_template, redirect, url_for,
                   request, flash, session)
from flask_login import login_user, logout_user, login_required, current_user
from models import db, User, Admin

auth_bp = Blueprint("auth", __name__)


# ---------------------------------------------------------------------------
# User Registration
# ---------------------------------------------------------------------------
@auth_bp.route("/register", methods=["GET", "POST"])
def register():
    if current_user.is_authenticated:
        return redirect(url_for("user.problems"))

    if request.method == "POST":
        username = request.form.get("username", "").strip()
        student_id = request.form.get("student_id", "").strip()
        password = request.form.get("password", "")
        confirm = request.form.get("confirm_password", "")

        if not username or not student_id or not password:
            flash("All fields are required.", "danger")
        elif password != confirm:
            flash("Passwords do not match.", "danger")
        elif User.query.filter_by(student_id=student_id).first():
            flash("A user with that Student ID already exists.", "danger")
        else:
            user = User(username=username, student_id=student_id)
            user.set_password(password)
            db.session.add(user)
            db.session.commit()
            flash("Registration successful! Please log in.", "success")
            return redirect(url_for("auth.login"))

    return render_template("auth/register.html")


# ---------------------------------------------------------------------------
# User Login
# ---------------------------------------------------------------------------
@auth_bp.route("/login", methods=["GET", "POST"])
def login():
    if current_user.is_authenticated:
        return redirect(url_for("user.problems"))

    if request.method == "POST":
        student_id = request.form.get("student_id", "").strip()
        password = request.form.get("password", "")
        user = User.query.filter_by(student_id=student_id).first()

        if user and user.check_password(password):
            login_user(user)
            flash(f"Welcome back, {user.username}!", "success")
            next_page = request.args.get("next")
            return redirect(next_page or url_for("user.problems"))
        else:
            flash("Invalid Student ID or password.", "danger")

    return render_template("auth/login.html")


# ---------------------------------------------------------------------------
# Admin Login
# ---------------------------------------------------------------------------
@auth_bp.route("/admin/login", methods=["GET", "POST"])
def admin_login():
    if session.get("is_admin"):
        return redirect(url_for("admin.dashboard"))

    if request.method == "POST":
        username = request.form.get("username", "").strip()
        password = request.form.get("password", "")
        admin = Admin.query.filter_by(username=username).first()

        if admin and admin.check_password(password):
            session["is_admin"] = True
            session["admin_username"] = admin.username
            flash(f"Admin access granted. Welcome, {admin.username}!", "success")
            return redirect(url_for("admin.dashboard"))
        else:
            flash("Invalid admin credentials.", "danger")

    return render_template("auth/admin_login.html")


# ---------------------------------------------------------------------------
# Logout (handles both user and admin)
# ---------------------------------------------------------------------------
@auth_bp.route("/logout")
def logout():
    session.pop("is_admin", None)
    session.pop("admin_username", None)
    logout_user()
    flash("You have been logged out.", "info")
    return redirect(url_for("auth.login"))
