import os
import cv2
import numpy as np
from fastapi import FastAPI, UploadFile, File, Query
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import tensorflow as tf

# Global placeholder for the Keras CNN model trained on Google Colab
MODEL_PATH = "ml_microservice/meter_digit_model.h5"
model = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Handles microservice startup and shutdown lifecycles cleanly.
    """
    global model
    if os.path.exists(MODEL_PATH):
        try:
            model = tf.keras.models.load_model(MODEL_PATH)
            print("Loaded custom Keras model successfully.")
        except Exception as e:
            print(f"Error loading Keras model: {e}. Running with mock engine.")
    else:
        print(f"Model file '{MODEL_PATH}' not found. Defaulting to Mock Engine.")
    
    yield
    # Resources can be cleanly released here during shutdown if needed

app = FastAPI(title="Meter Reader OCR Microservice", lifespan=lifespan)

def segment_and_predict_dials(image_bytes: bytes, dial_count: int) -> str:
    """
    1. Converts incoming image bytes to an OpenCV grayscale matrix.
    2. Slices the image vertically into equal horizontal segments to isolate dials.
    3. Resizes and normalizes patches to 32x32 to match Colab training dimensions.
    4. Passes the segments to the neural network for integer sequence extraction.
    """
    # Convert raw upload bytes into OpenCV image format
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_GRAYSCALE)
    
    if img is None:
        raise ValueError("Invalid image file format.")

    height, width = img.shape
    segment_width = width // dial_count
    predicted_digits = []

    # Iterate through each vertical slice boundary across the X-axis
    for i in range(dial_count):
        start_x = i * segment_width
        end_x = start_x + segment_width
        
        # CORRECTED: Slice syntax using [y_start:y_end, x_start:x_end]
        digit_crop = img[0:height, start_x:end_x]
        
        # Ensure the crop contains pixels before processing
        if digit_crop.size == 0:
            continue

        # Preprocessing Step: Resize to fit model's training layer requirement (32x32)
        resized_digit = cv2.resize(digit_crop, (32, 32), interpolation=cv2.INTER_AREA)
        
        # Normalize pixel values to match training distribution
        normalized_digit = resized_digit.astype("float32") / 255.0
        
        # Reshape to (1, 32, 32, 1) for neural net batch prediction
        input_data = np.expand_dims(normalized_digit, axis=(0, -1))
        
        # Inference Stage
        if model is not None:
            # use training mode performance optimization
            predictions = model(input_data, training=False)
            predicted_class = np.argmax(predictions[0])
            predicted_digits.append(str(predicted_class))
        else:
            # Mock Fallback Engine: Outputs clean mock sequences to ease prototyping
            mock_sequence = ["0", "0", "1", "4", "3", "7", "8"]
            predicted_digits.append(mock_sequence[i % len(mock_sequence)])

    return "".join(predicted_digits)


@app.post("/predict")
async def predict_meter_reading(
    image: UploadFile = File(...),
    dials: int = Query(default=5, description="Number of rolling dials inside the crop segment")
):
    try:
        # Read file binary stream
        img_bytes = await image.read()
        
        # Perform dynamic processing pipeline
        reading_string = segment_and_predict_dials(img_bytes, dials)
        
        return {
            "success": True,
            "reading": reading_string,
            "dials_processed": dials,
            "model_status": "Loaded" if model is not None else "Mocking"
        }
    except Exception as e:
        return JSONResponse(
            status_code=400,
            content={"success": False, "error": str(e)}
        )

# Run locally using: uvicorn ml_microservice:app --reload