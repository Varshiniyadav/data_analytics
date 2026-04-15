"""Preprocessing Module: Clean data, handle missing values, engineer features"""

import pandas as pd
import numpy as np

class DataPreprocessor:
    def __init__(self, df):
        self.df = df.copy()

    def clean_data(self):
        print("Starting data cleaning...")
        self.df.columns = self.df.columns.str.strip().str.title()
        date_cols = [col for col in self.df.columns if 'date' in col.lower() or 'order' in col.lower()]
        if date_cols:
            self.df['Order Date'] = pd.to_datetime(self.df[date_cols[0]], errors='coerce')
        self.df.dropna(subset=['Order Date'], inplace=True)
        for col in ['Sales', 'Profit', 'Quantity']:
            if col in self.df.columns:
                self.df[col] = pd.to_numeric(self.df[col], errors='coerce')
        if 'Sales' in self.df.columns:
            q99 = self.df['Sales'].quantile(0.99)
            self.df = self.df[(self.df['Sales'] > 0) & (self.df['Sales'] <= q99)]
        if 'Profit' not in self.df.columns and 'Sales' in self.df.columns:
            self.df['Profit'] = self.df['Sales'] * 0.25
        print(f"[OK] Cleaned data: {len(self.df)} rows remaining")
        return self

    def engineer_features(self):
        self.df['Year'] = self.df['Order Date'].dt.year
        self.df['Month'] = self.df['Order Date'].dt.month
        self.df['Quarter'] = self.df['Order Date'].dt.quarter
        self.df['Year-Month'] = self.df['Order Date'].dt.to_period('M').astype(str)
        self.df['Profit Margin'] = (self.df['Profit'] / self.df['Sales'] * 100).round(2)
        if 'Quantity' in self.df.columns:
            self.df['Price Per Unit'] = (self.df['Sales'] / self.df['Quantity']).round(2)
        print("[OK] Features engineered")
        return self

    def get_processed_data(self):
        return self.df

    def get_summary_stats(self):
        return {
            'total_records': len(self.df),
            'date_range': {
                'start': self.df['Order Date'].min().strftime('%Y-%m-%d'),
                'end': self.df['Order Date'].max().strftime('%Y-%m-%d')
            },
            'total_revenue': float(self.df['Sales'].sum()),
            'total_profit': float(self.df['Profit'].sum()),
            'avg_profit_margin': float(self.df['Profit Margin'].mean()),
            'unique_products': int(self.df['Product'].nunique()) if 'Product' in self.df.columns else 0,
            'unique_regions': int(self.df['Region'].nunique()) if 'Region' in self.df.columns else 0
        }
