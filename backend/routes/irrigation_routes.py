from flask import Blueprint, request, jsonify
from datetime import datetime
from database import db
from models import Farmer, IrrigationRecord


irrigation_bp = Blueprint(
    "irrigation",
    __name__,
    url_prefix="/api/irrigation"
)


@irrigation_bp.route("", methods=["POST"])
def create_irrigation():

    data = request.get_json()

    farmer_id = data.get("farmer_id")
    irrigation_date = data.get("irrigation_date")
    irrigation_time = data.get("irrigation_time")
    litres_allocated = data.get(
        "litres_allocated",
        0
    )

    farmer = db.session.get(
        Farmer,
        farmer_id
    )

    if not farmer:
        return jsonify({
            "error": "Farmer not found"
        }), 404

    try:
        irrigation_date = datetime.strptime(
            irrigation_date,
            "%Y-%m-%d"
        ).date()
    except (ValueError, TypeError):
        return jsonify({
            "error": "Date must be YYYY-MM-DD"
        }), 400

    record = IrrigationRecord(
        farmer_id=farmer_id,
        irrigation_date=irrigation_date,
        irrigation_time=irrigation_time,
        litres_allocated=litres_allocated,
        litres_delivered=0,
        status="Scheduled"
    )

    db.session.add(record)
    db.session.commit()

    return jsonify({
        "message": "Irrigation scheduled",
        "irrigation_id": record.id
    }), 201


@irrigation_bp.route(
    "/farmer/<int:farmer_id>",
    methods=["GET"]
)
def get_farmer_irrigation(farmer_id):

    records = IrrigationRecord.query.filter_by(
        farmer_id=farmer_id
    ).order_by(
        IrrigationRecord.irrigation_date.asc()
    ).all()

    return jsonify([
        {
            "id": record.id,
            "date": record.irrigation_date.isoformat(),
            "time": record.irrigation_time,
            "litres_allocated": record.litres_allocated,
            "litres_delivered": record.litres_delivered,
            "status": record.status
        }
        for record in records
    ])


@irrigation_bp.route(
    "/<int:record_id>",
    methods=["PUT"]
)
def update_irrigation(record_id):

    record = db.session.get(
        IrrigationRecord,
        record_id
    )

    if not record:
        return jsonify({
            "error": "Irrigation record not found"
        }), 404

    data = request.get_json()

    if "litres_delivered" in data:
        record.litres_delivered = data[
            "litres_delivered"
        ]

    if "status" in data:
        record.status = data["status"]

    db.session.commit()

    return jsonify({
        "message": "Irrigation updated"
    })