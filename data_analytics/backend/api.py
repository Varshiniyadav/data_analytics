"""FastAPI Backend — serves analytics data to the Next.js frontend"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from data_loader import DataLoader
from preprocessing import DataPreprocessor
from analysis import BusinessAnalyzer
from forecasting import RevenueForecaster
from advisor import BusinessAdvisor
from simulator import DecisionSimulator
import uvicorn

app = FastAPI(title="Sales Intelligence API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://192.168.1.4:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

data_cache = {}

@app.on_event("startup")
async def load_data():
    try:
        print("Loading data...")
        loader = DataLoader()
        try:
            df = loader.load_data()
        except:
            loader.fetch_dataset()
            df = loader.load_data()
        print("Processing data...")
        preprocessor = DataPreprocessor(df)
        clean_df = preprocessor.clean_data().engineer_features().get_processed_data()
        data_cache['df'] = clean_df
        data_cache['preprocessor'] = preprocessor
        print("[OK] Data loaded and cached successfully")
    except Exception as e:
        print(f"[WARNING] Error loading data: {e}")
        data_cache['error'] = str(e)

def _get_df():
    if 'df' not in data_cache:
        raise HTTPException(status_code=503, detail=data_cache.get('error', 'Data not loaded yet'))
    return data_cache['df']

@app.get("/")
async def root():
    return {
        "status": "online",
        "message": "Sales Intelligence API",
        "records": len(data_cache.get('df', [])),
        "docs": "/docs"
    }

@app.get("/api/summary")
async def get_summary():
    try:
        df = _get_df()
        analyzer = BusinessAnalyzer(df)
        return {
            "kpis": analyzer.get_kpis(),
            "insights": analyzer.generate_insights(),
            "data_info": data_cache['preprocessor'].get_summary_stats()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/trends")
async def get_trends():
    try:
        return {"monthly_trends": BusinessAnalyzer(_get_df()).revenue_trends()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/products")
async def get_products():
    try:
        df = _get_df()
        analyzer = BusinessAnalyzer(df)
        return {
            "products": analyzer.product_performance(),
            "profitability": analyzer.profitability_analysis()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/regions")
async def get_regions():
    try:
        return {"regions": BusinessAnalyzer(_get_df()).regional_analysis()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/forecast")
async def get_forecast(periods: int = 6):
    try:
        df = _get_df()
        forecaster = RevenueForecaster(df)
        monthly = forecaster.prepare_time_series()
        historical = [
            {'Date': row['Year-Month'], 'Forecasted_Revenue': round(row['Sales'], 2), 'Type': 'Historical'}
            for row in monthly.tail(12).to_dict('records')
        ]
        return {
            "forecast": forecaster.forecast_with_confidence(periods=periods),
            "trend_metrics": forecaster.get_trend_metrics(),
            "historical_data": historical
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/advisor")
async def get_advisor():
    try:
        return {"recommendations": BusinessAdvisor(_get_df()).generate_recommendations()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/simulate")
async def simulate(price_change: float = 0, discount: float = 0, volume_change: float = 0):
    try:
        return DecisionSimulator(_get_df()).simulate(price_change, discount, volume_change)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
