import os
import smtplib
from email.message import EmailMessage
from dotenv import load_dotenv

load_dotenv()


def send_registration_email(to_email, farmer_name):

    sender = os.getenv("GMAIL_ADDRESS")
    password = os.getenv("GMAIL_APP_PASSWORD")

    if not sender or not password:
        print("Gmail credentials are missing.")
        return False

    message = EmailMessage()

    message["Subject"] = "AquaTrace Registration Confirmation"
    message["From"] = sender
    message["To"] = to_email

    message.set_content(
        f"""Hello {farmer_name},

Your AquaTrace registration has been received successfully.

Your registration is currently IN PROGRESS.

We will notify you when your irrigation schedule is ready.

Thank you for joining AquaTrace.

Trace the water. Stop the loss. Grow more with every drop.
"""
    )

    try:
        with smtplib.SMTP_SSL(
            "smtp.gmail.com",
            465
        ) as server:

            server.login(sender, password)
            server.send_message(message)

        print("Email sent successfully.")
        return True

    except Exception as error:
        print("Email error:", error)
        return False
