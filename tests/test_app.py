from fastapi.testclient import TestClient
from src.app import app as application

client = TestClient(application)


def test_get_activities():
    res = client.get("/activities")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, dict)
    # Expect at least one known activity
    assert "Chess Club" in data


def test_signup_and_unregister_flow():
    activity = "Chess Club"
    email = "test_student@mergington.edu"

    # Ensure the student is not already registered
    res = client.get("/activities")
    participants = res.json()[activity]["participants"]
    if email in participants:
        # cleanup first if somehow present
        client.post(f"/activities/{activity}/unregister", params={"email": email})

    # Signup
    res = client.post(f"/activities/{activity}/signup", params={"email": email})
    assert res.status_code == 200
    assert "Signed up" in res.json().get("message", "")

    # Now unregister
    res = client.post(f"/activities/{activity}/unregister", params={"email": email})
    assert res.status_code == 200
    assert "Unregistered" in res.json().get("message", "")


def test_signup_nonexistent_activity():
    res = client.post("/activities/NoSuchActivity/signup", params={"email": "a@b.com"})
    assert res.status_code == 404


def test_unregister_nonexistent_participant():
    activity = "Chess Club"
    email = "i_dont_exist@mergington.edu"
    res = client.post(f"/activities/{activity}/unregister", params={"email": email})
    assert res.status_code == 404
