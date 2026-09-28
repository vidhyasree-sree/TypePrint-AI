from flask import Flask, request, jsonify
from flask_cors import CORS

import os
import json
import numpy as np

from sklearn.preprocessing import StandardScaler
from sklearn.svm import OneClassSVM

import joblib


# ==============================
# FLASK APP
# ==============================

app = Flask(__name__)
CORS(app)


# ==============================
# FOLDER PATHS
# ==============================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

DATA_DIR = os.path.join(BASE_DIR, "data")

USERS_FILE = os.path.join(
    DATA_DIR,
    "users.json"
)

MODEL_DIR = os.path.join(
    BASE_DIR,
    "models"
)


os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(MODEL_DIR, exist_ok=True)


# ==============================
# LOAD USERS
# ==============================

def load_users():

    if not os.path.exists(USERS_FILE):
        return {"users": []}

    try:

        with open(
            USERS_FILE,
            "r",
            encoding="utf-8"
        ) as file:

            return json.load(file)

    except Exception:

        return {"users": []}


# ==============================
# SAVE USERS
# ==============================

def save_users(data):

    with open(
        USERS_FILE,
        "w",
        encoding="utf-8"
    ) as file:

        json.dump(
            data,
            file,
            indent=4
        )


# ==============================
# FEATURE EXTRACTION
# ==============================

def extract_features(sample):

    dwell = float(
        sample.get("dwellTime", 0)
    )

    flight = float(
        sample.get("flightTime", 0)
    )

    speed = float(
        sample.get("typingSpeed", 0)
    )

    keystrokes = float(
        sample.get("keystrokes", 0)
    )

    return [
        dwell,
        flight,
        speed,
        keystrokes
    ]


# ==============================
# TRAIN AI MODEL
# ==============================

def train_user_model(
    user_id,
    samples
):

    if len(samples) < 3:

        return (
            False,
            "At least 3 samples are required."
        )


    X = np.array([

        extract_features(sample)

        for sample in samples

    ])


    # Standardize the data

    scaler = StandardScaler()

    X_scaled = scaler.fit_transform(X)


    # One-Class SVM

    model = OneClassSVM(
        kernel="rbf",
        gamma="scale",
        nu=0.15
    )


    model.fit(X_scaled)


    # Model file

    model_path = os.path.join(
        MODEL_DIR,
        f"{user_id}_model.pkl"
    )


    # Scaler file

    scaler_path = os.path.join(
        MODEL_DIR,
        f"{user_id}_scaler.pkl"
    )


    joblib.dump(
        model,
        model_path
    )


    joblib.dump(
        scaler,
        scaler_path
    )


    return (
        True,
        "AI model trained successfully."
    )


# ==============================
# HEALTH CHECK
# ==============================

@app.route(
    "/api/health",
    methods=["GET"]
)

def health():

    return jsonify({

        "status": "online",

        "message":
        "TypePrint AI Backend is running",

        "ai_engine":
        "One-Class SVM",

        "version":
        "1.0"

    })


# ==============================
# GET USERS
# ==============================

@app.route(
    "/api/users",
    methods=["GET"]
)

def get_users():

    data = load_users()

    users = []

    for user in data["users"]:

        users.append({

            "name":
            user["name"],

            "student_id":
            user["student_id"],

            "samples":
            len(user["samples"])

        })


    return jsonify({

        "success": True,

        "users": users

    })


# ==============================
# ENROLL USER
# ==============================

@app.route(
    "/api/enroll",
    methods=["POST"]
)

def enroll_user():

    data = request.get_json()


    if not data:

        return jsonify({

            "success": False,

            "message":
            "No data received"

        }), 400


    name = data.get(
        "name"
    )

    student_id = data.get(
        "student_id"
    )

    samples = data.get(
        "samples",
        []
    )


    if not name or not student_id:

        return jsonify({

            "success": False,

            "message":
            "Name and Student ID are required"

        }), 400


    if len(samples) < 10:

        return jsonify({

            "success": False,

            "message":
            "Please provide 10 typing samples"

        }), 400


    database = load_users()


    # Check duplicate student

    for user in database["users"]:

        if user["student_id"] == student_id:

            return jsonify({

                "success": False,

                "message":
                "Student already enrolled"

            }), 409


    # Create user

    new_user = {

        "name": name,

        "student_id": student_id,

        "samples": samples

    }


    database["users"].append(
        new_user
    )


    save_users(
        database
    )


    # Train AI

    trained, message = train_user_model(

        student_id,

        samples

    )


    if not trained:

        return jsonify({

            "success": False,

            "message": message

        }), 400


    return jsonify({

        "success": True,

        "message":
        "User enrolled and AI model trained",

        "user": {

            "name": name,

            "student_id":
            student_id,

            "samples":
            len(samples)

        }

    })


# ==============================
# VERIFY USER
# ==============================

@app.route(
    "/api/verify",
    methods=["POST"]
)

def verify_user():

    data = request.get_json()


    if not data:

        return jsonify({

            "success": False,

            "message":
            "No verification data received"

        }), 400


    student_id = data.get(
        "student_id"
    )

    sample = data.get(
        "sample"
    )


    if not student_id or not sample:

        return jsonify({

            "success": False,

            "message":
            "Student ID and typing sample are required"

        }), 400


    model_path = os.path.join(

        MODEL_DIR,

        f"{student_id}_model.pkl"

    )


    scaler_path = os.path.join(

        MODEL_DIR,

        f"{student_id}_scaler.pkl"

    )


    if not os.path.exists(
        model_path
    ):

        return jsonify({

            "success": False,

            "message":
            "User is not enrolled or model is missing"

        }), 404


    try:

        # Load AI model

        model = joblib.load(
            model_path
        )

        scaler = joblib.load(
            scaler_path
        )


        # Extract features

        features = np.array([

            extract_features(
                sample
            )

        ])


        # Scale features

        features_scaled = scaler.transform(
            features
        )


        # AI prediction

        prediction = model.predict(
            features_scaled
        )


        score = model.decision_function(
            features_scaled
        )[0]


        # Convert score to percentage

        confidence = 50 + (
            score * 20
        )


        confidence = max(
            0,
            min(
                100,
                confidence
            )
        )


        # Result

        if prediction[0] == 1:

            result = "Real User"

            status = "verified"

        else:

            result = "Proxy Detected"

            status = "proxy"


        return jsonify({

            "success": True,

            "result": result,

            "status": status,

            "confidence":
            round(
                confidence,
                2
            ),

            "features": {

                "dwell_time":
                round(
                    features[0][0],
                    2
                ),

                "flight_time":
                round(
                    features[0][1],
                    2
                ),

                "typing_speed":
                round(
                    features[0][2],
                    2
                ),

                "keystrokes":
                round(
                    features[0][3],
                    0
                )

            },

            "ai_model":
            "One-Class SVM"

        })


    except Exception as error:

        return jsonify({

            "success": False,

            "message":
            str(error)

        }), 500

# ==============================
# ANALYZE TYPING
# ==============================

@app.route(
    "/api/analyze",
    methods=["POST"]
)

def analyze_typing():

    data = request.get_json()

    if not data:

        return jsonify({

            "success": False,

            "message":
            "No typing data received"

        }), 400


    text = data.get(
        "text",
        ""
    )
    dwell_time = data.get("dwellTime", 0)
    flight_time = data.get("flightTime", 0)
    typing_speed = data.get("typingSpeed", 0)
    keystrokes = data.get("keystrokes", 0)

    if not text.strip():

        return jsonify({

            "success": False,

            "message":
            "Typing text is empty"

        }), 400


    # Basic typing information

    characters = len(text)

    words = len(text.split())

    return jsonify({

        "success": True,

        "message":
        "Typing data received successfully",

        "analysis": {
    "characters": characters,
    "words": words,
    "keystrokes": keystrokes,
    "dwellTime": round(dwell_time, 2),
    "flightTime": round(flight_time, 2),
    "typingSpeed": round(typing_speed, 2)
},

        "ai_model":
        "One-Class SVM"

    })
# ==============================
# SYSTEM TEST
# ==============================

@app.route(
    "/api/test",
    methods=["GET"]
)

def test_ai():

    database = load_users()


    total_users = len(
        database["users"]
    )


    total_samples = sum(

        len(user["samples"])

        for user in database["users"]

    )


    return jsonify({

        "success": True,

        "backend":
        "TypePrint",

        "ai_model":
        "One-Class SVM",

        "enrolled_users":
        total_users,

        "total_samples":
        total_samples,

        "message":
        "AI system ready"

    })


# ==============================
# START SERVER
# ==============================

if __name__ == "__main__":

    print()

    print(
        "======================================"
    )

    print(
        "        TYPEPRINT AI BACKEND"
    )

    print(
        "======================================"
    )

    print(
        "Server starting..."
    )

    print(
        "AI Model: One-Class SVM"
    )

    print()

    print(
        "Open:"
    )

    print(
        "http://127.0.0.1:5000/api/health"
    )

    print(
        "======================================"
    )

    print()


    app.run(

        host="127.0.0.1",

        port=5000,

        debug=True

    )