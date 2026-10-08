import os
import requests
from dotenv import load_dotenv

load_dotenv()


def send_registration_sms(phone, farmer_name):

    username = os.getenv("AT_USERNAME")
    api_key = os.getenv("AT_API_KEY")

    url = "https://api.sandbox.africastalking.com/version1/messaging"

    message = (
        f"Hello {farmer_name}. "
        "Your AquaTrace registration is in progress. "
        "We will notify you when your irrigation schedule is ready."
    )

    try:
        response = requests.post(
            url,
            headers={
                "apiKey": api_key,
                "Content-Type": "application/x-www-form-urlencoded"
            },
            data={
                "username": username,
                "to": phone,
                "message": message
            },
            timeout=15
        )

        print("SMS response:", response.text)

        return response.ok

    except Exception as error:
        print("SMS error:", error)
        return False

