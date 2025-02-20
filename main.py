import requests
from flask import Flask, request, jsonify
from flask_cors import CORS
import base64
app = Flask(__name__)
CORS(app)

# LM Studio API URL
LM_STUDIO_URL = "http://localhost:1234/v1/chat/completions"  # Update if different


def get_lm_studio_response(prompt, base64_image):
    """Sends a prompt and base64 image to LM Studio API (Qwen-2.5-VL) and returns the response."""
    try:
        # Ensure base64 string is clean (remove data:image/... if present)
        if "," in base64_image:
            base64_image = base64_image.split(",")[1]

        # Validate if base64 is decodable
        try:
            base64.b64decode(base64_image)
        except Exception as e:
            return f"Error: Invalid base64 encoding - {str(e)}"

        payload = {
            "model": "Qwen-2.5-VL",
            "messages": [
                {"role": "system", "content": "You are an AI that analyzes browser activity based on screenshots."},
                {"role": "user", "content": [
                    {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{base64_image}"}},  # Proper format
                    {"type": "text", "text": prompt}
                ]}
            ],
            "temperature": 0.5
        }

        response = requests.post(LM_STUDIO_URL, json=payload)
        response_data = response.json()
        #print(response_data)

        if "choices" in response_data and len(response_data["choices"]) > 0:
            res = response_data["choices"][0]["message"]["content"].strip()
            print(res)
            return res
        else:
            return "Error: No valid response from model."
    except Exception as e:
        return f"Error: {str(e)}"


@app.route("/analyze_screenshot", methods=["POST"])
def analyze_screenshot():
    """Analyzes whether the screenshot aligns with the user’s goal."""
    print("Analyzing screenshot...")
    data = request.get_json(force=True)
    print(data)

    base64_screenshot = data.get("base64Screenshot", "")
    goal = data.get("goal", "")

    prompt = f"""
    Given a screenshot of the user’s current activity in a browser, assess how relevant it is to their goal: '{goal}'.
    Determine the likelihood (1-100) that the user is off-task based on webpage content.
    Be strict but fair: some websites have multiple uses (e.g., YouTube for learning vs. entertainment).
    Respond with only a number (1-100), nothing else.
    """.strip()

    result = get_lm_studio_response(prompt, base64_screenshot)
    print(result)
    return  jsonify(result)


@app.route("/validate_reason", methods=["POST"])
def validate_reason():
    """Validates whether the user's reason for being on a webpage is justified."""
    print("Validating reason...")
    data = request.get_json(force=True)
    print(data)

    base64_screenshot = data.get("base64Screenshot", "")
    goal = data.get("goal", "")
    reason = data.get("reason", "")

    prompt = f"""
    Given a screenshot of the user’s current Chrome activity, determine if their given reason ('{reason}')
    justifies their current webpage use for the goal: '{goal}'.
    Respond with only 'pass' or 'fail'.
    """.strip()

    result = get_lm_studio_response(prompt, base64_screenshot)
    print(result)
    return  jsonify(result)


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=8080)