from flask import Blueprint, request, jsonify
from database import db
from models import Farmer


farmer_bp = Blueprint(
    "farmer",
    __name__,
    url_prefix="/api/farmers"
)


@farmer_bp.route("", methods=["POST"])
def register_farmer():

    data = request.get_json()

    if not data:
        return jsonify({
            "error": "No data provided"
        }), 400

    name = data.get("name")
    phone = data.get("phone")
    email = data.get("email")
    area = data.get("area")
    language = data.get("language", "English")

    if not name or not phone or not email or not area:
        return jsonify({
            "error": "Name, phone, email and area are required"
        }), 400

    existing = Farmer.query.filter_by(
        phone=phone
    ).first()

    if existing:
        return jsonify({
            "error": "Farmer already registered",
            "farmer_id": existing.id
        }), 409

    farmer = Farmer(
        name=name,
        phone=phone,
        email=email,
        area=area,
        language=language,
        status="In Progress"
    )

    db.session.add(farmer)
    db.session.commit()

    return jsonify({
        "message": "Farmer registered successfully",
        "farmer_id": farmer.id,
        "name": farmer.name,
        "status": farmer.status
    }), 201


@farmer_bp.route("", methods=["GET"])
def get_farmers():

    farmers = Farmer.query.order_by(
        Farmer.registered_at.desc()
    ).all()

    return jsonify([
        {
            "id": farmer.id,
            "name": farmer.name,
            "phone": farmer.phone,
            "email": farmer.email,
            "area": farmer.area,
            "language": farmer.language,
            "status": farmer.status,
            "registered_at": farmer.registered_at.isoformat()
        }
        for farmer in farmers
    ])


@farmer_bp.route("/<int:farmer_id>", methods=["GET"])
def get_farmer(farmer_id):

    farmer = db.session.get(
        Farmer,
        farmer_id
    )

    if not farmer:
        return jsonify({
            "error": "Farmer not found"
        }), 404

    return jsonify({
        "id": farmer.id,
        "name": farmer.name,
        "phone": farmer.phone,
        "email": farmer.email,
        "area": farmer.area,
        "language": farmer.language,
        "status": farmer.status,
        "registered_at": farmer.registered_at.isoformat()
    })


@farmer_bp.route(
    "/<int:farmer_id>/status",
    methods=["PUT"]
)
def update_status(farmer_id):

    farmer = db.session.get(
        Farmer,
        farmer_id
    )

    if not farmer:
        return jsonify({
            "error": "Farmer not found"
        }), 404

    data = request.get_json()

    farmer.status = data.get(
        "status",
        farmer.status
    )

    db.session.commit()

    return jsonify({
        "message": "Status updated",
        "status": farmer.status
    })