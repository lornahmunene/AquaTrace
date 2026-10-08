from flask import Flask, jsonify
from database import db

from models import (
    Farmer,
    IrrigationRecord,
    ErrorReport
)

from routes.farmer_routes import farmer_bp
from routes.irrigation_routes import irrigation_bp
from routes.error_routes import error_bp
from ussd.ussd_routes import ussd_bp


app = Flask(__name__)


# -----------------------------------------
# DATABASE
# -----------------------------------------

app.config["SQLALCHEMY_DATABASE_URI"] = (
    "sqlite:///aquatrace.db"
)

app.config[
    "SQLALCHEMY_TRACK_MODIFICATIONS"
] = False

db.init_app(app)


# -----------------------------------------
# ROUTES
# -----------------------------------------

app.register_blueprint(farmer_bp)
app.register_blueprint(irrigation_bp)
app.register_blueprint(error_bp)
app.register_blueprint(ussd_bp)


# -----------------------------------------
# HOME
# -----------------------------------------

@app.route("/")
def home():

    return "AquaTrace backend is running!"


# -----------------------------------------
# DASHBOARD SUMMARY
# -----------------------------------------

@app.route("/api/dashboard")
def dashboard():

    total_farmers = Farmer.query.count()

    pending_reports = ErrorReport.query.filter_by(
        status="Pending"
    ).count()

    scheduled_irrigation = IrrigationRecord.query.filter_by(
        status="Scheduled"
    ).count()

    return jsonify({
        "total_farmers": total_farmers,
        "pending_error_reports": pending_reports,
        "scheduled_irrigation": scheduled_irrigation
    })


# -----------------------------------------
# CREATE DATABASE
# -----------------------------------------

with app.app_context():
    db.create_all()


# -----------------------------------------
# RUN
# -----------------------------------------

if __name__ == "__main__":

    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True
    )