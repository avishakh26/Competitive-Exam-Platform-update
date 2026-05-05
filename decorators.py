from functools import wraps
from flask import session, redirect, url_for, flash


def admin_required(f):
    """Decorator to restrict routes to authenticated admin sessions."""
    @wraps(f)
    def decorated(*args, **kwargs):
        if not session.get("is_admin"):
            flash("Admin access required.", "danger")
            return redirect(url_for("auth.admin_login"))
        return f(*args, **kwargs)
    return decorated
