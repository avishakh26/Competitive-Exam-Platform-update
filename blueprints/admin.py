import os
from flask import (Blueprint, render_template, redirect, url_for,
                   request, flash, send_file, abort, current_app, session)
from werkzeug.utils import secure_filename
from sqlalchemy.exc import SQLAlchemyError
from models import db, Problem, Submission, User
from decorators import admin_required

admin_bp = Blueprint("admin", __name__, url_prefix="/admin")

ALLOWED_PDF_EXT = {".pdf"}


# ---------------------------------------------------------------------------
# Dashboard
# ---------------------------------------------------------------------------
@admin_bp.route("/dashboard")
@admin_required
def dashboard():
    total_users = User.query.count()
    total_problems = Problem.query.count()
    pending_count = Submission.query.filter_by(status="Pending").count()
    total_submissions = Submission.query.count()
    recent_subs = (Submission.query
                   .order_by(Submission.timestamp.desc())
                   .limit(5).all())
    return render_template("admin/dashboard.html",
                           total_users=total_users,
                           total_problems=total_problems,
                           pending_count=pending_count,
                           total_submissions=total_submissions,
                           recent_subs=recent_subs)


# ---------------------------------------------------------------------------
# Manage Problems — list
# ---------------------------------------------------------------------------
@admin_bp.route("/problems")
@admin_required
def manage_problems():
    problems = Problem.query.order_by(Problem.created_at.desc()).all()
    return render_template("admin/manage_problems.html", problems=problems)


# ---------------------------------------------------------------------------
# Add Problem
# ---------------------------------------------------------------------------
@admin_bp.route("/problems/add", methods=["GET", "POST"])
@admin_required
def add_problem():
    if request.method == "POST":
        title = request.form.get("title", "").strip()
        difficulty = request.form.get("difficulty", "Easy")
        points = request.form.get("points", 0, type=int)
        pdf_file = request.files.get("pdf_file")

        if not title or not points:
            flash("Title and points are required.", "danger")
            return redirect(request.url)

        if difficulty not in ("Easy", "Medium", "Hard"):
            flash("Invalid difficulty level.", "danger")
            return redirect(request.url)

        problem = Problem(title=title, difficulty=difficulty, points=points)
        db.session.add(problem)
        db.session.flush()  # Get the generated ID before commit

        # Handle PDF upload
        if pdf_file and pdf_file.filename:
            ext = os.path.splitext(pdf_file.filename)[1].lower()
            if ext not in ALLOWED_PDF_EXT:
                db.session.rollback()
                flash("Only PDF files are accepted for problem documents.", "danger")
                return redirect(request.url)

            pdf_filename = f"problem_{problem.id}.pdf"
            pdf_save_path = os.path.join(
                current_app.config["UPLOAD_FOLDER_PROBLEMS"], pdf_filename
            )
            pdf_file.save(pdf_save_path)
            problem.pdf_path = pdf_save_path

        db.session.commit()
        flash(f"✅ Problem '{title}' added successfully.", "success")
        return redirect(url_for("admin.manage_problems"))

    return render_template("admin/add_problem.html")


# ---------------------------------------------------------------------------
# Delete Problem
# ---------------------------------------------------------------------------
@admin_bp.route("/problems/delete/<int:pid>", methods=["POST"])
@admin_required
def delete_problem(pid):
    problem = Problem.query.get_or_404(pid)
    problem_title = problem.title

    try:
        # Remove all related submission files before deleting rows.
        related_submissions = Submission.query.filter_by(problem_id=problem.id).all()
        for sub in related_submissions:
            if sub.file_path and os.path.exists(sub.file_path):
                os.remove(sub.file_path)
            db.session.delete(sub)

        # Remove the problem PDF file if it exists.
        if problem.pdf_path and os.path.exists(problem.pdf_path):
            os.remove(problem.pdf_path)

        db.session.delete(problem)
        db.session.commit()
        flash(f"Problem '{problem_title}' deleted.", "info")
    except (OSError, SQLAlchemyError) as exc:
        db.session.rollback()
        flash(f"Could not delete '{problem_title}': {exc}", "danger")

    return redirect(url_for("admin.manage_problems"))


# ---------------------------------------------------------------------------
# Manage Users
# ---------------------------------------------------------------------------
@admin_bp.route("/users")
@admin_required
def manage_users():
    users = User.query.order_by(User.created_at.desc()).all()
    return render_template("admin/manage_users.html", users=users)


# ---------------------------------------------------------------------------
# Delete (Kick) User
# ---------------------------------------------------------------------------
@admin_bp.route("/users/delete/<int:uid>", methods=["POST"])
@admin_required
def delete_user(uid):
    user = User.query.get_or_404(uid)
    username = user.username

    try:
        # Remove all related submission files before deleting rows.
        related_submissions = Submission.query.filter_by(user_id=user.id).all()
        for sub in related_submissions:
            if sub.file_path and os.path.exists(sub.file_path):
                os.remove(sub.file_path)
            db.session.delete(sub)

        db.session.delete(user)
        db.session.commit()
        flash(f"User '{username}' has been kicked from the site.", "warning")
    except (OSError, SQLAlchemyError) as exc:
        db.session.rollback()
        flash(f"Could not kick '{username}': {exc}", "danger")

    return redirect(url_for("admin.manage_users"))



# ---------------------------------------------------------------------------
# Review Queue — pending submissions
# ---------------------------------------------------------------------------
@admin_bp.route("/review")
@admin_required
def review_queue():
    pending = (Submission.query
               .filter_by(status="Pending")
               .order_by(Submission.timestamp.asc())
               .all())
    return render_template("admin/review_queue.html", submissions=pending)


# ---------------------------------------------------------------------------
# Approve Submission
# ---------------------------------------------------------------------------
@admin_bp.route("/review/<int:sid>/approve", methods=["POST"])
@admin_required
def approve(sid):
    submission = Submission.query.get_or_404(sid)

    # Capture the old status BEFORE changing anything
    old_status = submission.status

    # Update submission status
    submission.status = "Approved"
    feedback = request.form.get("feedback", "").strip()
    if feedback:
        submission.feedback = feedback

    # -----------------------------------------------------------------
    # Score update — only fires when transitioning FROM a non-Approved
    # state, preventing double-scoring if admin re-approves.
    # -----------------------------------------------------------------
    score_added = 0
    if old_status != "Approved":
        problem = db.session.get(Problem, submission.problem_id)
        user = db.session.get(User, submission.user_id)
        if problem and user:
            user.total_score = (user.total_score or 0) + problem.points
            score_added = problem.points

    db.session.commit()

    if score_added:
        flash(
            f"Submission #{sid} approved! +{score_added} points added to "
            f"{submission.user.username}'s score.",
            "success"
        )
    else:
        flash(f"Submission #{sid} approved (already scored — no points added).", "info")

    return redirect(url_for("admin.review_queue"))


# ---------------------------------------------------------------------------
# Reject Submission
# ---------------------------------------------------------------------------
@admin_bp.route("/review/<int:sid>/reject", methods=["POST"])
@admin_required
def reject(sid):
    submission = Submission.query.get_or_404(sid)
    submission.status = "Rejected"
    feedback = request.form.get("feedback", "").strip()
    submission.feedback = feedback or "No feedback provided."
    db.session.commit()
    flash(f"Submission #{sid} rejected.", "warning")
    return redirect(url_for("admin.review_queue"))


# ---------------------------------------------------------------------------
# View submission code file (for admin code preview)
# ---------------------------------------------------------------------------
@admin_bp.route("/submission/<int:sid>/code")
@admin_required
def view_code(sid):
    submission = Submission.query.get_or_404(sid)
    code_content = ""
    language = "python"
    if submission.file_path and os.path.exists(submission.file_path):
        ext = os.path.splitext(submission.file_path)[1].lower()
        lang_map = {".py": "python", ".cpp": "c_cpp", ".c": "c_cpp", ".java": "java"}
        language = lang_map.get(ext, "text")
        try:
            with open(submission.file_path, "r", encoding="utf-8", errors="replace") as f:
                code_content = f.read()
        except Exception:
            code_content = "Error reading file."

    return render_template("admin/view_code.html",
                           submission=submission,
                           code_content=code_content,
                           language=language)
