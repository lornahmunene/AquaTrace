from flask import Blueprint, request, jsonify
from database import db
from models import Farmer, ErrorReport


error_bp = Blueprint(
    "error",
    __name__,
    url_prefix="/api/error-reports"
)


@error_bp.route("", methods=["POST"])
def create_error_report():

    data = request.get_json()

    farmer_id = data.get("farmer_id")
    error_type = data.get("error_type")
    description = data.get("description")

    farmer = db.session.get(
        Farmer,
        farmer_id
    )

    if not farmer:
        return jsonify({
            "error": "Farmer not found"
        }), 404

    if not error_type or not description:
        return jsonify({
            "error": "Error type and description are required"
        }), 400

    report = ErrorReport(
        farmer_id=farmer_id,
        error_type=error_type,
        description=description,
        status="Pending"
    )

    db.session.add(report)
    db.session.commit()

    return jsonify({
        "message": "Error report submitted",
        "report_id": report.id,
        "status": report.status
    }), 201


@error_bp.route("", methods=["GET"])
def get_error_reports():

    reports = ErrorReport.query.order_by(
        ErrorReport.reported_at.desc()
    ).all()

    return jsonify([
        {
            "id": report.id,
            "farmer_id": report.farmer_id,
            "error_type": report.error_type,
            "description": report.description,
            "status": report.status,
            "reported_at": report.reported_at.isoformat()
        }
        for report in reports
    ])


@error_bp.route(
    "/<int:report_id>",
    methods=["PUT"]
)
def update_error_report(report_id):

    report = db.session.get(
        ErrorReport,
        report_id
    )

    if not report:
        return jsonify({
            "error": "Report not found"
        }), 404

    data = request.get_json()

    report.status = data.get(
        "status",
        report.status
    )

    db.session.commit()

    return jsonify({
        "message": "Error report updated",
        "status": report.status
    })