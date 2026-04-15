"""Forecasting Module: Predict future revenue trends using Linear Regression"""

import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
from datetime import timedelta

class RevenueForecaster:
    def __init__(self, df):
        self.df = df
        self.model = LinearRegression()
    
    def prepare_time_series(self):
        monthly = self.df.groupby('Year-Month').agg({
            'Sales': 'sum',
            'Profit': 'sum'
        }).reset_index()
        monthly['Date'] = pd.to_datetime(monthly['Year-Month'])
        monthly = monthly.sort_values('Date')
        return monthly
    
    def forecast_with_confidence(self, periods=6):
        monthly = self.prepare_time_series()
        monthly['Time_Index'] = range(len(monthly))
        
        X = monthly[['Time_Index']].values
        y = monthly['Sales'].values
        
        self.model.fit(X, y)
        
        # Calculate residual standard error
        predictions_train = self.model.predict(X)
        residuals = y - predictions_train
        std_error = np.std(residuals)
        
        # Forecast
        last_index = monthly['Time_Index'].max()
        future_indices = np.array([[last_index + i] for i in range(1, periods + 1)])
        predictions = self.model.predict(future_indices)
        
        # Simple confidence interval (±2 std errors)
        lower_bound = predictions - (2 * std_error)
        upper_bound = predictions + (2 * std_error)
        
        last_date = monthly['Date'].max()
        future_dates = [last_date + timedelta(days=30*i) for i in range(1, periods + 1)]
        
        forecast_data = []
        for i, date in enumerate(future_dates):
            forecast_data.append({
                'date': date.strftime('%Y-%m'),
                'forecast': float(round(predictions[i], 2)),
                'lower_bound': float(round(max(0, lower_bound[i]), 2)),
                'upper_bound': float(round(upper_bound[i], 2))
            })
        
        return forecast_data
    
    def get_trend_metrics(self):
        monthly = self.prepare_time_series()
        monthly['Time_Index'] = range(len(monthly))
        
        X = monthly[['Time_Index']].values
        y = monthly['Sales'].values
        
        self.model.fit(X, y)
        
        # Model performance
        r_squared = self.model.score(X, y)
        slope = self.model.coef_[0]
        
        # Calculate average monthly growth
        avg_revenue = monthly['Sales'].mean()
        monthly_growth_rate = (slope / avg_revenue * 100) if avg_revenue > 0 else 0
        
        return {
            'trend_direction': 'Upward' if slope > 0 else 'Downward',
            'monthly_growth_rate': round(monthly_growth_rate, 2),
            'trend_strength': round(r_squared * 100, 2),  # R² as percentage
            'avg_monthly_revenue': round(avg_revenue, 2)
        }


