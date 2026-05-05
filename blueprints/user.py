import os
from flask import (Blueprint, render_template, redirect, url_for,
                   request, flash, send_file, abort, current_app)
from flask_login import login_required, current_user
from werkzeug.utils import secure_filename
from models import db, Problem, Submission

user_bp = Blueprint("user", __name__)

ALLOWED_CODE_EXT = {".py", ".cpp", ".java", ".c"}


# ---------------------------------------------------------------------------
# Root → redirect
# ---------------------------------------------------------------------------
@user_bp.route("/")
def index():
    return redirect(url_for("user.problems"))


# ---------------------------------------------------------------------------
# Problem List
# ---------------------------------------------------------------------------
@user_bp.route("/problems")
@login_required
def problems():
    all_problems = Problem.query.order_by(Problem.created_at.desc()).all()
    return render_template("user/problems.html", problems=all_problems)


# ---------------------------------------------------------------------------
# Problem Detail (with PDF embed)
# ---------------------------------------------------------------------------
@user_bp.route("/problem/<int:pid>")
@login_required
def problem_detail(pid):
    problem = Problem.query.get_or_404(pid)

    # Check if user already has a Pending submission for this problem
    pending = Submission.query.filter_by(
        user_id=current_user.id,
        problem_id=pid,
        status="Pending"
    ).first()

    return render_template("user/problem_detail.html",
                           problem=problem,
                           has_pending=bool(pending))


# ---------------------------------------------------------------------------
# Serve PDF securely (no direct filesystem exposure)
# ---------------------------------------------------------------------------
@user_bp.route("/problem/<int:pid>/pdf")
@login_required
def serve_pdf(pid):
    problem = Problem.query.get_or_404(pid)
    if not problem.pdf_path or not os.path.exists(problem.pdf_path):
        abort(404)
    return send_file(problem.pdf_path,
                     mimetype="application/pdf",
                     as_attachment=False)


# ---------------------------------------------------------------------------
# Submit Code
# ---------------------------------------------------------------------------
@user_bp.route("/problem/<int:pid>/submit", methods=["GET", "POST"])
@login_required
def submit(pid):
    problem = Problem.query.get_or_404(pid)

    if request.method == "POST":
        # Duplicate Pending check
        existing = Submission.query.filter_by(
            user_id=current_user.id,
            problem_id=pid,
            status="Pending"
        ).first()
        if existing:
            flash("⚠️ You already have a pending submission for this problem. "
                  "Wait for it to be reviewed before submitting again.", "warning")
            return redirect(url_for("user.my_submissions"))

        code_file = request.files.get("code_file")
        if not code_file or not code_file.filename:
            flash("Please select a code file to upload.", "danger")
            return redirect(request.url)

        ext = os.path.splitext(code_file.filename)[1].lower()
        if ext not in ALLOWED_CODE_EXT:
            flash(f"Invalid file type '{ext}'. Allowed: .py, .cpp, .java, .c", "danger")
            return redirect(request.url)

        safe_name = secure_filename(code_file.filename)
        # Build unique filename: user_<uid>_problem_<pid>_<original>
        unique_name = f"user_{current_user.id}_problem_{pid}_{safe_name}"
        save_path = os.path.join(
            current_app.config["UPLOAD_FOLDER_SUBMISSIONS"], unique_name
        )
        code_file.save(save_path)

        submission = Submission(
            user_id=current_user.id,
            problem_id=pid,
            file_path=save_path,
            status="Pending"
        )
        db.session.add(submission)
        db.session.commit()

        flash("✅ Submission received! You'll be notified once it's reviewed.", "success")
        return redirect(url_for("user.my_submissions"))

    return render_template("user/submit.html", problem=problem)


# ---------------------------------------------------------------------------
# My Submissions
# ---------------------------------------------------------------------------
@user_bp.route("/my-submissions")
@login_required
def my_submissions():
    subs = (Submission.query
            .filter_by(user_id=current_user.id)
            .order_by(Submission.timestamp.desc())
            .all())
    return render_template("user/my_submissions.html", submissions=subs)


# ---------------------------------------------------------------------------
# Leaderboard
# ---------------------------------------------------------------------------
@user_bp.route("/leaderboard")
@login_required
def leaderboard():
    from models import User
    users = User.query.order_by(User.total_score.desc()).all()
    return render_template("user/leaderboard.html", users=users)

# ---------------------------------------------------------------------------
# Profile
# ---------------------------------------------------------------------------
@user_bp.route("/profile/<username>")
@login_required
def profile(username):
    from models import User, Submission
    user = User.query.filter_by(username=username).first_or_404()
    
    # Calculate global rank
    all_users = User.query.order_by(User.total_score.desc()).all()
    global_rank = next((i + 1 for i, u in enumerate(all_users) if u.id == user.id), "-")
    
    # Calculate problems solved
    solved_count = db.session.query(Submission.problem_id).filter_by(
        user_id=user.id, status="Approved"
    ).distinct().count()
    
    # Heatmap data: Last 180 days submissions count
    from datetime import datetime, timedelta, timezone
    today = datetime.now(timezone.utc).date()
    start_date = today - timedelta(days=168)  # 24 weeks exactly
    
    recent_subs = Submission.query.filter(
        Submission.user_id == user.id,
        Submission.timestamp >= start_date
    ).all()
    
    heatmap_data = {}
    for sub in recent_subs:
        date_str = sub.timestamp.date().isoformat()
        heatmap_data[date_str] = heatmap_data.get(date_str, 0) + 1
        
    return render_template("user/profile.html", 
                           profile_user=user, 
                           solved_count=solved_count,
                           global_rank=global_rank,
                           heatmap_data=heatmap_data,
                           start_date=start_date.isoformat(),
                           today=today.isoformat())

