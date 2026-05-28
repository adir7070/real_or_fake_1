def test_health_returns_200(client):
    resp = client.get("/health")
    assert resp.status_code == 200


def test_health_fields(client):
    data = client.get("/health").json()
    assert "status" in data
    assert "model_loaded" in data
    assert "version" in data
    assert "uptime_s" in data


def test_health_status_ok(client):
    data = client.get("/health").json()
    assert data["status"] == "ok"


def test_health_model_loaded_is_bool(client):
    data = client.get("/health").json()
    assert isinstance(data["model_loaded"], bool)
