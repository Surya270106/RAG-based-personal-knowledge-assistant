# Climate Visibility Predictor 

A machine learning web app that predicts climate visibility based on weather conditions like temperature, humidity, wind speed, pressure, and wind bearing.

This project combines a trained ML model with a clean futuristic frontend built using Flask, HTML, CSS, and JavaScript.

---

## Features

- Predicts visibility in kilometers
- Simple and interactive UI
- Flask backend API
- Machine Learning model integration
- Real-time predictions from user input
- Responsive futuristic frontend design

---

##  Tech Stack

### Backend
- Python
- Flask
- Pandas
- Scikit-learn
- Joblib

### Frontend
- HTML
- CSS
- JavaScript

### Machine Learning
- Regression model trained using weather/climate data

---

##  Project Structure

```bash
Visabilty/
│
├── server.py                     # Flask backend server
├── index.html                    # Frontend UI
├── train_visibility.ipynb        # Model training notebook
├── visibility_model.pkl          # Trained ML model
├── requirements.txt              # Python dependencies
```

---

##  Installation & Setup

### 1. Clone the repository

```bash
git clone https://github.com/your-username/climate-visibility-predictor.git
cd climate-visibility-predictor
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

### 3. Train the model (if model file is missing)

Run the notebook:

```bash
train_visibility.ipynb
```

This generates:

```bash
visibility_model.pkl
```

### 4. Start the Flask server

```bash
python server.py
```

---

##  Open in Browser

After running the server, open:

```bash
http://localhost:5000
```

---

##  Input Parameters

The model predicts visibility using:

- Temperature (°C)
- Humidity
- Wind Speed (km/h)
- Wind Bearing (degrees)
- Pressure (millibars)

---

##  How It Works

1. User enters weather data
2. Frontend sends request to Flask API
3. Backend loads trained ML model
4. Model predicts visibility
5. Result is displayed instantly on the webpage

---

##  Project Preview

The interface is designed with a modern sci-fi inspired theme featuring:
- Animated UI elements
- Custom cursor effects
- Smooth transitions
- Interactive prediction section

---

##  Future Improvements

- Add weather API integration
- Deploy online using Render or Vercel
- Improve model accuracy
- Add prediction graphs and analytics
- Mobile app version

---

##  Contributing

Contributions are welcome.

If you'd like to improve the project:
1. Fork the repository
2. Create a new branch
3. Commit your changes
4. Open a pull request

---

