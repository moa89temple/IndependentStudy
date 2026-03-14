"""
Lambda: Study questions feature. Proxies to main app ECS (MAIN_APP_URL).
API Gateway path /study-questions/* -> main app /api/* (e.g. /api/courses/1/questions).
"""
import json
import os
import urllib.request

MAIN_APP_URL = os.environ.get("MAIN_APP_URL", "").rstrip("/")


def handler(event, context):
    if not MAIN_APP_URL:
        return {"statusCode": 200, "body": json.dumps({"message": "Study questions feature", "configure": "MAIN_APP_URL"}), "headers": {"Content-Type": "application/json"}}
    path = event.get("rawPath") or event.get("path") or "/"
    if path.startswith("/study-questions"):
        path = "/api" + path[len("/study-questions"):] or "/"
    qs = event.get("rawQueryString") or ""
    if not qs and isinstance(event.get("queryStringParameters"), dict):
        qs = "&".join(f"{k}={v}" for k, v in event["queryStringParameters"].items())
    url = f"{MAIN_APP_URL}{path}"
    if qs:
        url += "?" + qs
    method = (event.get("requestContext") or {}).get("http", {}).get("method", "GET")
    req = urllib.request.Request(url, method=method)
    try:
        with urllib.request.urlopen(req, timeout=25) as r:
            return {"statusCode": 200, "body": r.read().decode(), "headers": {"Content-Type": "application/json"}}
    except Exception as e:
        return {"statusCode": 502, "body": json.dumps({"error": str(e)}), "headers": {"Content-Type": "application/json"}}
# testing