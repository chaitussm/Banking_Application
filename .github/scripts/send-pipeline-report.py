#!/usr/bin/env python3
"""Send the pipeline HTML report using SMTP secrets/env."""

from __future__ import annotations

import os
import smtplib
import ssl
import sys
from email import encoders
from email.mime.base import MIMEBase
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from pathlib import Path


def extract_email(value: str) -> str:
    value = (value or "").strip()
    if "<" in value and ">" in value:
        return value.split("<", 1)[1].split(">", 1)[0].strip()
    return value


def infer_server(from_email: str, explicit_server: str) -> str:
    if explicit_server:
        return explicit_server
    domain = from_email.rsplit("@", 1)[-1].lower()
    known = {
        "gmail.com": "smtp.gmail.com",
        "googlemail.com": "smtp.gmail.com",
        "outlook.com": "smtp.office365.com",
        "hotmail.com": "smtp.office365.com",
        "live.com": "smtp.office365.com",
        "msn.com": "smtp.office365.com",
        "yahoo.com": "smtp.mail.yahoo.com",
        "ymail.com": "smtp.mail.yahoo.com",
    }
    return known.get(domain, f"smtp.{domain}" if domain else "")


def main() -> int:
    from_raw = os.environ.get("SMTP_FROM", "").strip()
    to_raw = os.environ.get("SMTP_TO", "").strip()
    html_path = Path(os.environ.get("REPORT_HTML_PATH", "artifacts/reports/pipeline-report.html"))
    subject = os.environ.get(
        "REPORT_SUBJECT",
        "NovaBank Dev Pipeline report",
    )

    if not from_raw or not to_raw:
        print("SMTP_FROM and SMTP_TO must be set.", file=sys.stderr)
        return 1
    if not html_path.is_file():
        print(f"HTML report not found: {html_path}", file=sys.stderr)
        return 1

    from_email = extract_email(from_raw)
    server = infer_server(from_email, os.environ.get("SMTP_SERVER", "").strip())
    port = int(os.environ.get("SMTP_PORT") or "587")
    username = os.environ.get("SMTP_USERNAME", "").strip() or from_email
    password = os.environ.get("SMTP_PASSWORD", "")

    if not server:
        print("Could not determine SMTP server address.", file=sys.stderr)
        return 1

    print(f"Using SMTP server {server}:{port}")

    if not password:
        print(
            "Skipping email send: SMTP_PASSWORD is not set. "
            "Gmail and other authenticated SMTP servers require a repository "
            "secret named SMTP_PASSWORD (Gmail: App Password for the SMTP_FROM account). "
            "The HTML report artifact was still published."
        )
        return 0

    html = html_path.read_text(encoding="utf-8")

    message = MIMEMultipart("mixed")
    message["Subject"] = subject
    message["From"] = from_raw
    message["To"] = to_raw
    message.attach(MIMEText(html, "html", "utf-8"))

    attachment = MIMEBase("text", "html")
    attachment.set_payload(html.encode("utf-8"))
    encoders.encode_base64(attachment)
    attachment.add_header("Content-Disposition", "attachment", filename=html_path.name)
    message.attach(attachment)

    recipients = [part.strip() for part in to_raw.split(",") if part.strip()]
    context = ssl.create_default_context()

    with smtplib.SMTP(server, port, timeout=45) as smtp:
        smtp.ehlo()
        smtp.starttls(context=context)
        smtp.ehlo()
        smtp.login(username, password)
        smtp.sendmail(from_email, recipients, message.as_string())

    print("HTML report email sent.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
