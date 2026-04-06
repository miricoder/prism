#!/usr/bin/env python3
"""Simple login smoke test for NextAuth credentials flow."""

from __future__ import annotations

import json
import os
import sys
from datetime import datetime, timezone
import urllib.parse
import urllib.request
from http.cookiejar import CookieJar


def http_get(url: str, headers: dict[str, str] | None = None) -> tuple[int, str, dict[str, str]]:
    req = urllib.request.Request(url, headers=headers or {}, method="GET")
    with urllib.request.urlopen(req) as resp:
        return resp.status, resp.read().decode("utf-8"), dict(resp.headers)


def http_post_form(
    opener: urllib.request.OpenerDirector,
    url: str,
    data: dict[str, str],
    headers: dict[str, str] | None = None,
) -> tuple[int, str, dict[str, str]]:
    body = urllib.parse.urlencode(data).encode("utf-8")
    req = urllib.request.Request(url, data=body, headers=headers or {}, method="POST")
    with opener.open(req) as resp:
        return resp.status, resp.read().decode("utf-8"), dict(resp.headers)


def main() -> int:
    base_url = os.environ.get("BASE_URL", "http://localhost:3000").rstrip("/")
    email = os.environ.get("AUTH_EMAIL", "test@example.com")
    password = os.environ.get("AUTH_PASSWORD", "password123")
    report_path = os.environ.get(
            "TEST_REPORT_PATH",
            "/Users/miralimirzayev/Desktop/vibe/RND/prism/public/docs/test-report.json",
    )

    print(f"Base URL: {base_url}")

    results: list[dict[str, object]] = []

    # Check providers
    status, providers_body, providers_headers = http_get(f"{base_url}/api/auth/providers")
    if status != 200:
        print(f"FAIL providers: {status}")
        return 1
    results.append({
        "name": "providers",
        "request": {"method": "GET", "url": f"{base_url}/api/auth/providers"},
        "response": {"status": status, "headers": providers_headers, "body": providers_body},
    })
    print("OK providers")

    # Prepare cookie jar for session and CSRF
    jar = CookieJar()
    opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))

    # Get CSRF with cookie support
    req = urllib.request.Request(f"{base_url}/api/auth/csrf", method="GET")
    with opener.open(req) as resp:
        status = resp.status
        csrf_body = resp.read().decode("utf-8")
        csrf_headers = dict(resp.headers)
    if status != 200:
        print(f"FAIL csrf: {status}")
        return 1
    try:
        csrf = json.loads(csrf_body)["csrfToken"]
    except Exception as exc:
        print(f"FAIL csrf parse: {exc}")
        return 1
    results.append({
        "name": "csrf",
        "request": {"method": "GET", "url": f"{base_url}/api/auth/csrf"},
        "response": {"status": status, "headers": csrf_headers, "body": csrf_body},
    })

    # Login via credentials
    status, auth_body, headers = http_post_form(
        opener,
        f"{base_url}/api/auth/callback/credentials",
        {
            "csrfToken": csrf,
            "email": email,
            "password": password,
            "redirect": "false",
            "callbackUrl": base_url,
            "json": "true",
        },
        {"Content-Type": "application/x-www-form-urlencoded"},
    )

    if status not in (200, 302):
        print(f"FAIL credentials: {status}")
        print(auth_body[:500])
        return 1

    results.append({
        "name": "credentials",
        "request": {
            "method": "POST",
            "url": f"{base_url}/api/auth/callback/credentials",
            "body": {
                "csrfToken": csrf,
                "email": email,
                "password": "***redacted***",
                "redirect": "false",
                "callbackUrl": base_url,
                "json": "true",
            },
        },
        "response": {"status": status, "headers": headers, "body": auth_body},
    })
    print("OK credentials")

    # Fetch session using same cookies
    req = urllib.request.Request(f"{base_url}/api/auth/session", method="GET")
    with opener.open(req) as resp:
        session_status = resp.status
        session_body = resp.read().decode("utf-8")
        session_headers = dict(resp.headers)

    if session_status != 200:
        print(f"FAIL session: {session_status}")
        return 1

    try:
        session_json = json.loads(session_body)
    except Exception as exc:
        print(f"FAIL session parse: {exc}")
        return 1

    if not session_json:
        print("FAIL session: empty")
        return 1

    results.append({
        "name": "session",
        "request": {"method": "GET", "url": f"{base_url}/api/auth/session"},
        "response": {"status": session_status, "headers": session_headers, "body": session_body},
    })
    print("OK session")
    print("PASS login smoke test")
    report = {
        "status": "pass",
        "baseUrl": base_url,
        "checkedAt": datetime.now(timezone.utc).isoformat(),
        "results": results,
    }
    try:
        os.makedirs(os.path.dirname(report_path), exist_ok=True)
        with open(report_path, "w", encoding="utf-8") as handle:
            json.dump(report, handle, indent=2)
    except Exception as exc:
        print(f"WARN report write failed: {exc}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
