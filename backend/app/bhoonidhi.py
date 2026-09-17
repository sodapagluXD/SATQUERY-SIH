import os
import time
import requests
from fastapi import HTTPException

load_dotenv()

BHOONIDHI_AUTH = "https://bhoonidhi-api.nrsc.gov.in/auth/token"
BHOONIDHI_DATA = "https://bhoonidhi-api.nrsc.gov.in/data"

TOKEN_CACHE = {"access_token": None, "expires_at": 0}

def get_valid_token() -> str:
    current_time = time.time()
    if TOKEN_CACHE["access_token"] and current_time < (TOKEN_CACHE["expires_at"] - 60):
        return TOKEN_CACHE["access_token"]
        
    auth_payload = {
        "userId": os.getenv("BHOONIDHI_USER"), 
        "password": os.getenv("BHOONIDHI_PASS"),
        "grant_type": "password"
    }
    try:
        token_resp = requests.post(BHOONIDHI_AUTH, json=auth_payload, timeout=10)
        if token_resp.status_code == 200:
            auth_data = token_resp.json()
            TOKEN_CACHE["access_token"] = auth_data.get("access_token")
            TOKEN_CACHE["expires_at"] = current_time + auth_data.get("expires_in", 1200)
            return TOKEN_CACHE["access_token"]
    except Exception:
        pass
    return "MOCK_TOKEN"

def fetch_satellite_data(bbox: str, datetime_range: str) -> str:
    token = get_valid_token()
    headers = {"Authorization": f"Bearer {token}"}
    params = {"bbox": bbox, "datetime": datetime_range, "limit": 1}
    
    try:
        search_resp = requests.get(BHOONIDHI_DATA, headers=headers, params=params, timeout=10)
        if search_resp.status_code == 200:
            items = search_resp.json().get("features", [])
            if items:
                return f"./data/{items[0]['id']}.tif"
    except Exception:
        pass
    
    # Fallback path for prototype execution
    return "./data/sample_sentinel.tif"