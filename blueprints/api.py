import os
from datetime import timezone

from flask import Blueprint, jsonify, request, session, current_app, url_for
from flask_login import current_user, login_user, logout_user
from werkzeug.utils import secure_filename
from sqlalchemy.exc import SQLAlchemyError

from models import db, Admin, Problem, Submission, User

api_bp = Blueprint("api", __name__, url_prefix="/api")

ALLOWED_CODE_EXT = {".py", ".cpp", ".java", ".c"}
ALLOWED_PDF_EXT = {".pdf"}


def _json_error(message, status=400):
    return jsonify({"ok": False, "error": message}), status


def _submission_to_dict(sub):
    return {
        "id": sub.id,
        "problemId": sub.problem_id,
        "problemTitle": sub.problem.title if sub.problem else None,
        "userId": sub.user_id,
        "username": sub.user.username if sub.user else None,
        "status": sub.status,
        "feedback": sub.feedback,
        "timestamp": sub.timestamp.isoformat() if sub.timestamp else None,
        "filePath": sub.file_path,
    }


def _problem_to_dict(problem):
    return {
        "id": problem.id,
        "title": problem.title,
        "difficulty": problem.difficulty,
        "points": problem.points,
        "createdAt": problem.created_at.isoformat() if problem.created_at else None,
    }


def _require_user():
    if not current_user.is_authenticated:
        return _json_error("Authentication required.", 401)
    return None


def _require_admin():
    if not session.get("is_admin"):
        return _json_error("Admin authentication required.", 401)
    return None


@api_bp.route("/auth/session", methods=["GET"])
def auth_session():
    if session.get("is_admin"):
        return jsonify(
            {
                "ok": True,
                "role": "admin",
                "admin": {"username": session.get("admin_username")},
            }
        )

    if current_user.is_authenticated:
        return jsonify(
            {
                "ok": True,
                "role": "user",
                "user": {
                    "id": current_user.id,
                    "username": current_user.username,
                    "studentId": current_user.student_id,
                    "totalScore": current_user.total_score,
                },
            }
        )

    return jsonify({"ok": True, "role": "guest"})


@api_bp.route("/auth/register", methods=["POST"])
def auth_register():
    data = request.get_json(silent=True) or {}
    username = str(data.get("username", "")).strip()
    student_id = str(data.get("studentId", "")).strip()
    password = str(data.get("password", ""))
    confirm = str(data.get("confirmPassword", ""))

    if not username or not student_id or not password:
        return _json_error("All fields are required.")
    if password != confirm:
        return _json_error("Passwords do not match.")
    if User.query.filter_by(student_id=student_id).first():
        return _json_error("A user with that Student ID already exists.")

    user = User(username=username, student_id=student_id)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    return jsonify({"ok": True, "message": "Registration successful."})


@api_bp.route("/auth/login", methods=["POST"])
def auth_login():
    data = request.get_json(silent=True) or {}
    student_id = str(data.get("studentId", "")).strip()
    password = str(data.get("password", ""))

    user = User.query.filter_by(student_id=student_id).first()
    if not user or not user.check_password(password):
        return _json_error("Invalid Student ID or password.", 401)

    session.pop("is_admin", None)
    session.pop("admin_username", None)
    login_user(user)

    return jsonify(
        {
            "ok": True,
            "role": "user",
            "user": {
                "id": user.id,
                "username": user.username,
                "studentId": user.student_id,
                "totalScore": user.total_score,
            },
        }
    )


@api_bp.route("/auth/admin/login", methods=["POST"])
def auth_admin_login():
    data = request.get_json(silent=True) or {}
    username = str(data.get("username", "")).strip()
    password = str(data.get("password", ""))

    admin = Admin.query.filter_by(username=username).first()
    if not admin or not admin.check_password(password):
        return _json_error("Invalid admin credentials.", 401)

    logout_user()
    session["is_admin"] = True
    session["admin_username"] = admin.username

    return jsonify(
        {
            "ok": True,
            "role": "admin",
            "admin": {"username": admin.username},
        }
    )


@api_bp.route("/auth/logout", methods=["POST"])
def auth_logout():
    session.pop("is_admin", None)
    session.pop("admin_username", None)
    logout_user()
    return jsonify({"ok": True})


@api_bp.route("/problems", methods=["GET"])
def list_problems():
    auth_error = _require_user()
    if auth_error:
        return auth_error

    problems = Problem.query.order_by(Problem.created_at.desc()).all()
    return jsonify({"ok": True, "problems": [_problem_to_dict(p) for p in problems]})


@api_bp.route("/problems/<int:pid>", methods=["GET"])
def get_problem(pid):
    auth_error = _require_user()
    if auth_error:
        return auth_error

    problem = Problem.query.get_or_404(pid)
    pending = Submission.query.filter_by(
        user_id=current_user.id,
        problem_id=pid,
        status="Pending",
    ).first()

    payload = _problem_to_dict(problem)
    payload["hasPending"] = bool(pending)
    payload["pdfUrl"] = url_for("api.get_problem_pdf", pid=pid)

    return jsonify({"ok": True, "problem": payload})


@api_bp.route("/problems/<int:pid>/pdf", methods=["GET"])
def get_problem_pdf(pid):
    auth_error = _require_user()
    if auth_error:
        return auth_error

    problem = Problem.query.get_or_404(pid)
    if not problem.pdf_path or not os.path.exists(problem.pdf_path):
        return _json_error("PDF not found.", 404)

    from flask import send_file

    return send_file(problem.pdf_path, mimetype="application/pdf", as_attachment=False)


@api_bp.route("/problems/<int:pid>/submit", methods=["POST"])
def submit_problem(pid):
    auth_error = _require_user()
    if auth_error:
        return auth_error

    Problem.query.get_or_404(pid)

    existing = Submission.query.filter_by(
        user_id=current_user.id,
        problem_id=pid,
        status="Pending",
    ).first()
    if existing:
        return _json_error("You already have a pending submission for this problem.")

    code_file = request.files.get("codeFile") or request.files.get("code_file")
    if not code_file or not code_file.filename:
        return _json_error("Please select a code file to upload.")

    ext = os.path.splitext(code_file.filename)[1].lower()
    if ext not in ALLOWED_CODE_EXT:
        return _json_error("Invalid file type. Allowed: .py, .cpp, .java, .c")

    safe_name = secure_filename(code_file.filename)
    unique_name = f"user_{current_user.id}_problem_{pid}_{safe_name}"
    save_path = os.path.join(current_app.config["UPLOAD_FOLDER_SUBMISSIONS"], unique_name)
    code_file.save(save_path)

    submission = Submission(
        user_id=current_user.id,
        problem_id=pid,
        file_path=save_path,
        status="Pending",
    )
    db.session.add(submission)
    db.session.commit()

    return jsonify({"ok": True, "message": "Submission uploaded."})


@api_bp.route("/submissions/mine", methods=["GET"])
def my_submissions():
    auth_error = _require_user()
    if auth_error:
        return auth_error

    submissions = (
        Submission.query.filter_by(user_id=current_user.id)
        .order_by(Submission.timestamp.desc())
        .all()
    )
    return jsonify({"ok": True, "submissions": [_submission_to_dict(s) for s in submissions]})


@api_bp.route("/leaderboard", methods=["GET"])
def leaderboard():
    auth_error = _require_user()
    if auth_error:
        return auth_error

    users = User.query.order_by(User.total_score.desc()).all()
    return jsonify(
        {
            "ok": True,
            "users": [
                {
                    "id": u.id,
                    "username": u.username,
                    "studentId": u.student_id,
                    "totalScore": u.total_score,
                    "createdAt": u.created_at.astimezone(timezone.utc).isoformat() if u.created_at else None,
                }
                for u in users
            ],
        }
    )


@api_bp.route("/admin/dashboard", methods=["GET"])
def admin_dashboard():
    auth_error = _require_admin()
    if auth_error:
        return auth_error

    total_users = User.query.count()
    total_problems = Problem.query.count()
    pending_count = Submission.query.filter_by(status="Pending").count()
    total_submissions = Submission.query.count()
    recent_subs = Submission.query.order_by(Submission.timestamp.desc()).limit(5).all()

    return jsonify(
        {
            "ok": True,
            "stats": {
                "totalUsers": total_users,
                "totalProblems": total_problems,
                "pendingCount": pending_count,
                "totalSubmissions": total_submissions,
            },
            "recentSubmissions": [_submission_to_dict(s) for s in recent_subs],
        }
    )


@api_bp.route("/admin/problems", methods=["GET"])
def admin_list_problems():
    auth_error = _require_admin()
    if auth_error:
        return auth_error

    problems = Problem.query.order_by(Problem.created_at.desc()).all()
    return jsonify({"ok": True, "problems": [_problem_to_dict(p) for p in problems]})


@api_bp.route("/admin/problems", methods=["POST"])
def admin_add_problem():
    auth_error = _require_admin()
    if auth_error:
        return auth_error

    title = str(request.form.get("title", "")).strip()
    difficulty = str(request.form.get("difficulty", "Easy"))
    points = request.form.get("points", type=int)
    pdf_file = request.files.get("pdfFile") or request.files.get("pdf_file")

    if not title or points is None:
        return _json_error("Title and points are required.")
    if difficulty not in ("Easy", "Medium", "Hard"):
        return _json_error("Invalid difficulty level.")

    problem = Problem(title=title, difficulty=difficulty, points=points)
    db.session.add(problem)
    db.session.flush()

    if pdf_file and pdf_file.filename:
        ext = os.path.splitext(pdf_file.filename)[1].lower()
        if ext not in ALLOWED_PDF_EXT:
            db.session.rollback()
            return _json_error("Only PDF files are accepted.")

        pdf_filename = f"problem_{problem.id}.pdf"
        pdf_save_path = os.path.join(current_app.config["UPLOAD_FOLDER_PROBLEMS"], pdf_filename)
        pdf_file.save(pdf_save_path)
        problem.pdf_path = pdf_save_path

    db.session.commit()
    return jsonify({"ok": True, "problem": _problem_to_dict(problem)})


@api_bp.route("/admin/problems/<int:pid>", methods=["DELETE"])
def admin_delete_problem(pid):
    auth_error = _require_admin()
    if auth_error:
        return auth_error

    problem = Problem.query.get_or_404(pid)
    problem_title = problem.title

    try:
        related_submissions = Submission.query.filter_by(problem_id=problem.id).all()
        for sub in related_submissions:
            if sub.file_path and os.path.exists(sub.file_path):
                os.remove(sub.file_path)
            db.session.delete(sub)

        if problem.pdf_path and os.path.exists(problem.pdf_path):
            os.remove(problem.pdf_path)

        db.session.delete(problem)
        db.session.commit()
        return jsonify({"ok": True})
    except (OSError, SQLAlchemyError) as exc:
        db.session.rollback()
        return _json_error(f"Could not delete '{problem_title}': {exc}", 500)


@api_bp.route("/admin/review", methods=["GET"])
def admin_review_queue():
    auth_error = _require_admin()
    if auth_error:
        return auth_error

    pending = (
        Submission.query.filter_by(status="Pending")
        .order_by(Submission.timestamp.asc())
        .all()
    )
    return jsonify({"ok": True, "submissions": [_submission_to_dict(s) for s in pending]})


@api_bp.route("/admin/review/<int:sid>/approve", methods=["POST"])
def admin_approve(sid):
    auth_error = _require_admin()
    if auth_error:
        return auth_error

    submission = Submission.query.get_or_404(sid)
    old_status = submission.status

    submission.status = "Approved"
    feedback = str((request.get_json(silent=True) or {}).get("feedback", "")).strip()
    if feedback:
        submission.feedback = feedback

    score_added = 0
    if old_status != "Approved":
        problem = db.session.get(Problem, submission.problem_id)
        user = db.session.get(User, submission.user_id)
        if problem and user:
            user.total_score = (user.total_score or 0) + problem.points
            score_added = problem.points

    db.session.commit()
    return jsonify({"ok": True, "scoreAdded": score_added})


@api_bp.route("/admin/review/<int:sid>/reject", methods=["POST"])
def admin_reject(sid):
    auth_error = _require_admin()
    if auth_error:
        return auth_error

    submission = Submission.query.get_or_404(sid)
    data = request.get_json(silent=True) or {}
    feedback = str(data.get("feedback", "")).strip()

    submission.status = "Rejected"
    submission.feedback = feedback or "No feedback provided."
    db.session.commit()

    return jsonify({"ok": True})


@api_bp.route("/admin/submission/<int:sid>/code", methods=["GET"])
def admin_submission_code(sid):
    auth_error = _require_admin()
    if auth_error:
        return auth_error

    submission = Submission.query.get_or_404(sid)
    code_content = ""
    language = "python"

    if submission.file_path and os.path.exists(submission.file_path):
        ext = os.path.splitext(submission.file_path)[1].lower()
        lang_map = {".py": "python", ".cpp": "cpp", ".c": "c", ".java": "java"}
        language = lang_map.get(ext, "text")
        try:
            with open(submission.file_path, "r", encoding="utf-8", errors="replace") as f:
                code_content = f.read()
        except Exception:
            code_content = "Error reading file."

    return jsonify(
        {
            "ok": True,
            "submission": _submission_to_dict(submission),
            "language": language,
            "code": code_content,
        }
    )
