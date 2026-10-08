from datetime import datetime
from database import db


class Farmer(db.Model):
    id = db.Column(db.Integer, primary_key=True)

    name = db.Column(db.String(100), nullable=False)

    phone = db.Column(
        db.String(20),
        nullable=False,
        unique=True
    )

    email = db.Column(
        db.String(120),
        nullable=False
    )

    area = db.Column(
        db.String(100),
        nullable=False
    )

    language = db.Column(
        db.String(20),
        default="English"
    )

    status = db.Column(
        db.String(30),
        default="In Progress"
    )

    registered_at = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )


class IrrigationRecord(db.Model):
    id = db.Column(
        db.Integer,
        primary_key=True
    )

    farmer_id = db.Column(
        db.Integer,
        db.ForeignKey("farmer.id"),
        nullable=False
    )

    irrigation_date = db.Column(
        db.Date,
        nullable=False
    )

    irrigation_time = db.Column(
        db.String(20),
        nullable=False
    )

    litres_allocated = db.Column(
        db.Float,
        default=0
    )

    litres_delivered = db.Column(
        db.Float,
        default=0
    )

    status = db.Column(
        db.String(30),
        default="Scheduled"
    )

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )


class ErrorReport(db.Model):
    id = db.Column(
        db.Integer,
        primary_key=True
    )

    farmer_id = db.Column(
        db.Integer,
        db.ForeignKey("farmer.id"),
        nullable=False
    )

    error_type = db.Column(
        db.String(100),
        nullable=False
    )

    description = db.Column(
        db.String(500),
        nullable=False
    )

    status = db.Column(
        db.String(30),
        default="Pending"
    )

    reported_at = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )