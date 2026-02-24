# FDR_DATALINK ✈️

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![Next.js](https://img.shields.io/badge/Next.js-15.x-black?logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.x-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-19.x-61DAFB?logo=react&logoColor=black)](https://reactjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.x-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

**FDR_DATALINK** is a professional flight data analysis and visualization dashboard. It enables researchers and aviation enthusiasts to analyze de-identified flight recorder data, providing insights into aircraft dynamics and system performance.

---

## 🚀 Overview

The interface serves as a telemetry pipeline for MATLAB (`.mat`) flight data files, specifically sourced from the **NASA Dashlink** project. It combines a high-performance Python backend (FastAPI) for data processing with a modern, responsive React/Next.js frontend.

### Key Features
- **File Explorer**: Browse and select from a library of flight recorder data.
- **Real-time Telemetry Visualization**: Interactive multi-graph suite using Plotly.js.
- **KPI Monitoring**: Focus on critical parameters like Altitude, Airspeed, Pitch, Roll, and Vertical Acceleration.
- **Data Downsampling**: Intelligent server-side downsampling for smooth visualization of large datasets.
- **NASA Dashlink Integration**: Leverages authentic de-identified aggregate flight recorder data.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: [Next.js 15+](https://nextjs.org/) (App Router, Client Components)
- **Styling**: [Tailwind CSS 4+](https://tailwindcss.com/)
- **Charts**: [React-Plotly.js](https://plotly.com/javascript/react/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)

### Backend
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/)
- **Data Processing**: [SciPy](https://scipy.org/), [NumPy](https://numpy.org/)
- **Runtime**: Python 3.x

---

## 📦 Getting Started

### Prerequisites
- Node.js (v18+)
- Python (v3.9+)
- npm / yarn / pnpm

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/dhruvhaldar/FDR_DATALINK.git
   cd FDR_DATALINK
   ```

2. **Backend Setup**:
   Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. **Frontend Setup**:
   Install Node dependencies:
   ```bash
   npm install
   ```

### Running the Application

1. **Start the Backend**:
   The backend runs on port `8000`.
   ```bash
   python api/index.py
   # or
   uvicorn api.index:app --reload
   ```

2. **Start the Frontend**:
   The frontend runs on port `3000`.
   ```bash
   npm run dev
   ```

3. **Open the Dashboard**:
   Navigate to [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📊 Data Source

The telemetry data displayed in this application is provided by the **[NASA Dashlink Sample Flight Data project](https://c3.ndc.nasa.gov/dashlink/projects/85/)**. 

> [!NOTE]
> The files contain actual data recorded onboard regional jets in commercial service. They are de-identified and do not contain information traceable to specific airlines or manufacturers.

---

## 📄 License

This project is licensed under the **GNU GPLv3 License**.

## 👤 Author

**Dhruv Haldar**
- Website: [dhruvhaldar.vercel.app](https://dhruvhaldar.vercel.app/)
- GitHub: [@dhruvhaldar](https://github.com/dhruvhaldar)
