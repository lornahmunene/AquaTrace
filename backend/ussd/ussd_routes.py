from flask import Blueprint, request
from datetime import date

from database import db
from models import Farmer, IrrigationRecord, ErrorReport

from services.email_service import send_registration_email
from services.sms_service import send_registration_sms


ussd_bp = Blueprint(
    "ussd",
    __name__
)


@ussd_bp.route(
    "/ussd",
    methods=["POST"]
)
def ussd():

    phone = request.form.get(
        "phoneNumber",
        ""
    )

    text = request.form.get(
        "text",
        ""
    )

    parts = text.split("*") if text else []

    # ==========================================
    # LANGUAGE SELECTION
    # ==========================================

    if len(parts) == 0:
        return (
            "CON Welcome to AquaTrace\n"
            "Select language:\n"
            "1. English\n"
            "2. Kiswahili\n"
            "3. Kamba"
        )

    language = parts[0]

    if language not in ["1", "2", "3"]:
        return "END Invalid selection."

    # ==========================================
    # MAIN MENU
    # ==========================================

    if len(parts) == 1:

        if language == "1":
            return (
                "CON AquaTrace\n"
                "1. Register\n"
                "2. My Account"
            )

        if language == "2":
            return (
                "CON AquaTrace\n"
                "1. Jisajili\n"
                "2. Akaunti Yangu"
            )

        return (
            "CON AquaTrace\n"
            "1. Register\n"
            "2. My Account"
        )

    # ==========================================
    # FARMER REGISTRATION
    # ==========================================

    if parts[1] == "1":

        # Ask for name
        if len(parts) == 2:
            return "CON Enter your full name:"

        # Ask for area
        if len(parts) == 3:
            return (
                "CON Enter your area:\n"
                "Example: Machakos"
            )

        # Ask for email
        if len(parts) == 4:
            return "CON Enter your email:"

        # Save farmer
        if len(parts) == 5:

            name = parts[2]
            area = parts[3]
            email = parts[4]

            # Africa's Talking automatically
            # provides the farmer's phone number.
            farmer_phone = phone

            # Check if already registered
            existing = Farmer.query.filter_by(
                phone=farmer_phone
            ).first()

            if existing:
                return (
                    "END You are already registered "
                    "with AquaTrace."
                )

            language_name = {
                "1": "English",
                "2": "Kiswahili",
                "3": "Kamba"
            }[language]

            farmer = Farmer(
                name=name,
                phone=farmer_phone,
                area=area,
                email=email,
                language=language_name,
                status="In Progress"
            )

            db.session.add(farmer)
            db.session.commit()

            # Send confirmation email
            send_registration_email(
                farmer.email,
                farmer.name
            )

            # Send confirmation SMS
            send_registration_sms(
                farmer.phone,
                farmer.name
            )

            return (
                "END Registration successful!\n"
                "Your AquaTrace registration is "
                "In Progress.\n"
                "You will receive confirmation by "
                "SMS and email."
            )

    # ==========================================
    # EXISTING FARMER ACCOUNT
    # ==========================================

    if parts[1] == "2":

        farmer = Farmer.query.filter_by(
            phone=phone
        ).first()

        if not farmer:
            return (
                "END You are not registered.\n"
                "Please select Register first."
            )

        # Account menu
        if len(parts) == 2:
            return (
                "CON Welcome "
                + farmer.name
                + "\n"
                "1. Irrigation Status\n"
                "2. Next Irrigation\n"
                "3. Litres Received Today\n"
                "4. Report Error\n"
                "5. My Profile\n"
                "6. Help"
            )

        # ======================================
        # IRRIGATION STATUS
        # ======================================

        if parts[2] == "1":

            record = IrrigationRecord.query.filter_by(
                farmer_id=farmer.id
            ).order_by(
                IrrigationRecord.irrigation_date.desc()
            ).first()

            if not record:
                return (
                    "END No irrigation record "
                    "available yet."
                )

            return (
                "END Irrigation Status:\n"
                + record.status
                + "\nAllocated: "
                + str(record.litres_allocated)
                + " L"
            )

        # ======================================
        # NEXT IRRIGATION
        # ======================================

        if parts[2] == "2":

            upcoming = IrrigationRecord.query.filter(
                IrrigationRecord.farmer_id == farmer.id,
                IrrigationRecord.irrigation_date >= date.today()
            ).order_by(
                IrrigationRecord.irrigation_date.asc()
            ).first()

            if not upcoming:
                return (
                    "END No upcoming irrigation "
                    "has been scheduled."
                )

            return (
                "END Next irrigation:\n"
                + str(upcoming.irrigation_date)
                + "\nTime: "
                + upcoming.irrigation_time
                + "\nAllocated: "
                + str(upcoming.litres_allocated)
                + " L"
            )

        # ======================================
        # LITRES RECEIVED TODAY
        # ======================================

        if parts[2] == "3":

            records = IrrigationRecord.query.filter_by(
                farmer_id=farmer.id,
                irrigation_date=date.today()
            ).all()

            total = sum(
                record.litres_delivered
                for record in records
            )

            return (
                "END Litres received today:\n"
                + str(total)
                + " L"
            )

        # ======================================
        # REPORT ERROR
        # ======================================

        if parts[2] == "4":

            if len(parts) == 3:
                return (
                    "CON Report a problem:\n"
                    "1. No water\n"
                    "2. Low pressure\n"
                    "3. Leak\n"
                    "4. Other"
                )

            if len(parts) == 4:
                return "CON Describe the problem:"

            if len(parts) == 5:

                error_types = {
                    "1": "No water",
                    "2": "Low pressure",
                    "3": "Leak",
                    "4": "Other"
                }

                error_type = error_types.get(
                    parts[3],
                    "Other"
                )

                report = ErrorReport(
                    farmer_id=farmer.id,
                    error_type=error_type,
                    description=parts[4],
                    status="Pending"
                )

                db.session.add(report)
                db.session.commit()

                return (
                    "END Report submitted.\n"
                    "Our technicians will "
                    "investigate the issue."
                )

        # ======================================
        # PROFILE
        # ======================================

        if parts[2] == "5":

            return (
                "END My Profile\n"
                "Name: "
                + farmer.name
                + "\nArea: "
                + farmer.area
                + "\nPhone: "
                + farmer.phone
                + "\nStatus: "
                + farmer.status
            )

        # ======================================
        # HELP
        # ======================================

        if parts[2] == "6":

            return (
                "END AquaTrace Help\n"
                "Use this service to check "
                "irrigation information, "
                "water received and report "
                "water problems."
            )

    return "END Invalid request."