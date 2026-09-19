```markdown
# SatQuery AI 🌍🛰️

**SatQuery AI** is a full-stack, AI-powered geospatial analysis engine developed as a Smart India Hackathon (SIH) prototype. It bridges the gap between raw satellite imagery and actionable insights by allowing users to select geographic bounding boxes on an interactive 3D globe and issue natural language queries against that specific region. 

The system leverages a 4-bit quantized **Qwen2.5-VL-7B-Instruct** vision-language model (VLM) acting as an automated GIS analyst, capable of identifying urban expansion, waterlogging conditions, vegetation health, and infrastructure developments directly from satellite raster data.

---

## 🛠️ Tech Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | React, Vite, Tailwind CSS | High-performance UI with responsive, utility-first styling. |
| **Mapping** | Mapbox GL JS, Mapbox Draw | Interactive 3D globe and bounding polygon selection tools. |
| **Markdown** | React-Markdown, Tailwind Typography | Renders the VLM's structured, text-rich analytical outputs. |
| **Backend** | Python, FastAPI, Uvicorn | High-speed, asynchronous REST API architecture. |
| **Tunneling** | Pyngrok | Exposes the cloud GPU backend to the local React frontend. |
| **AI / ML** | PyTorch, HuggingFace Transformers | Core machine learning frameworks handling model weights. |
| **Vision Model**| Qwen2.5-VL-7B-Instruct | State-of-the-art vision-language model for geospatial analysis. |
| **Optimization**| BitsAndBytes | 4-bit model quantization to fit the 14GB model into a standard GPU. |

---

## 📋 Prerequisites

Before setting up the project, ensure you have the following accounts and tokens ready:
1. **Mapbox Access Token:** For rendering the interactive satellite map.
2. **Ngrok Auth Token:** To tunnel the backend server from Google Colab.
3. **HuggingFace Account:** (Optional but recommended) To prevent rate limits when downloading the 14GB model weights.
4. **Node.js & npm:** Installed on your local machine for the frontend.

---

## 💻 Frontend Setup (Local Development)

The React frontend runs locally and connects to either your local CPU fallback backend or the live Google Colab GPU backend.

1. **Clone the repository and navigate to the frontend directory:**
   ```bash
   git clone [https://github.com/sodapagluXD/SATQUERY-SIH.git](https://github.com/sodapagluXD/SATQUERY-SIH.git)
   cd SATQUERY-SIH/frontend

```

2. **Install dependencies:**
```bash
npm install
npm install react-markdown @tailwindcss/typography

```


3. **Configure Environment Variables:**
Create a `.env` file in the root of the frontend directory and add your Mapbox token:
```env
VITE_MAPBOX_TOKEN=your_mapbox_public_token_here

```


4. **Start the development server:**
```bash
npm run dev

```


*The frontend UI will be available at `http://localhost:5173`.*

---

## ☁️ Backend Setup (Google Colab GPU)

To execute the massive Qwen2.5-VL model without running out of memory, the backend is designed to run on a free Google Colab **T4 GPU** and tunnel the API endpoints back to your local machine using Ngrok.

1. Open a new [Google Colab Notebook](https://colab.research.google.com/?utm_source=gemini).
2. Navigate to **Runtime > Change runtime type** and select **T4 GPU**.
3. Create a new code cell, paste the following deployment script, and run it:

```python
# 0. Reset to root directory
import os
os.chdir('/content')

# 1. Install dependencies
!pip install -q fastapi uvicorn pyngrok nest_asyncio python-dotenv requests rasterio pillow torch torchvision transformers accelerate bitsandbytes qwen-vl-utils

# 2. Clean clone
if os.path.exists("SATQUERY-SIH"):
    !rm -rf SATQUERY-SIH
!git clone [https://github.com/sodapagluXD/SATQUERY-SIH.git](https://github.com/sodapagluXD/SATQUERY-SIH.git)

%cd SATQUERY-SIH/backend

# 3. Setup Ngrok and start server asynchronously
import nest_asyncio
import uvicorn
from pyngrok import ngrok
from app.main import app

nest_asyncio.apply()

# 🔑 PASTE YOUR ACTUAL NGROK AUTH TOKEN BELOW
ngrok.set_auth_token("<YOUR_NGROK_AUTH_TOKEN>")

# Clear old processes to prevent ERR_NGROK_334
ngrok.kill()

# Connect fresh standard tunnel
public_url = ngrok.connect(8000)
print(f"\n🚀 Ngrok Tunnel Active!\n👉 Public URL: {public_url}\n")

# Run server on T4 GPU
config = uvicorn.Config(app=app, host="0.0.0.0", port=8000, log_level="info")
server = uvicorn.Server(config)

await server.serve()

```

*Note: The script will take several minutes on the first run to download the 14GB model weights into the GPU VRAM.*

---

## 🏃‍♂️ Backend Setup (Local CPU Fallback)

If you are strictly working on UI/UX design and do not want to boot up the Google Colab environment, you can run the backend locally. The system will automatically detect the absence of a CUDA GPU and safely activate **Local Fallback Mode**, returning hardcoded mock data for immediate UI testing.

1. **Navigate to the backend directory:**
```bash
cd SATQUERY-SIH/backend

```


2. **Create a Python virtual environment and install dependencies:**
```bash
python -m venv .venv
# On Mac/Linux: source .venv/bin/activate 
# On Windows: .venv\Scripts\activate
pip install fastapi uvicorn rasterio pillow

```


3. **Start the Uvicorn server:**
```bash
uvicorn app.main:app --reload

```



---

## 🔍 How to Perform Queries

Once both your frontend and backend are running, follow these steps to use the AI engine:

1. **Connect the Backend:**
* Copy the `Public URL` generated in your Google Colab terminal (e.g., `https://xxxx.ngrok-free.app`).
* Paste this URL into the **"BACKEND URL"** input field on the left sidebar of the SatQuery AI web interface.
*(If using the Local CPU Fallback, enter `http://localhost:8000`).*


2. **Select a Region:**
* Use your mouse to navigate the Mapbox 3D globe.
* Click the polygon draw tool (hexagon icon) in the top right corner of the map.
* Draw a bounding box around your specific area of interest (e.g., Salt Lake Sector V). The coordinates will automatically populate in the sidebar.


3. **Draft the Query:**
* Type a natural language analytical question in the query box (e.g., *"Analyze waterlogging conditions during monsoon"* or *"Identify the ratio of built-up urban area to green space"*).


4. **Analyze:**
* Click the **"Analyze Imagery"** button. The frontend will package the bounding box coordinates and text prompt, transmit them through the Ngrok tunnel, and trigger the Qwen2.5-VL model on the Colab GPU.
* Review the final, evidence-grounded Markdown report populated in the **VLM ANALYSIS OUTPUT** panel.



---

**Developed by Souvik Das (IEM Kolkata) | Team Binary Blitz**

```

```