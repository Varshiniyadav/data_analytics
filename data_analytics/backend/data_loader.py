"""Data Loader: Fetch or generate sales dataset"""

import os
import pandas as pd

class DataLoader:
    def __init__(self):
        self.data_path = 'data/'
        os.makedirs(self.data_path, exist_ok=True)
        
        # Try to import Kaggle API (optional)
        try:
            from kaggle.api.kaggle_api_extended import KaggleApi
            self.api = KaggleApi()
            self.api.authenticate()
            self.kaggle_available = True
            print("[OK] Kaggle API authenticated")
        except Exception as e:
            self.api = None
            self.kaggle_available = False
            print(f"[WARNING] Kaggle API not available: {e}")
            print("[OK] Will use sample data generation")
    
    def fetch_dataset(self):
        """
        Fetch Superstore Sales dataset from Kaggle
        Dataset: Contains Order Date, Product, Sales, Profit, Region, Customer
        Why this dataset: Real-world retail data with all required fields
        """
        if not self.kaggle_available:
            print("Kaggle API not available, generating sample data")
            self._generate_sample_data()
            return
            
        try:
            # Download Sample Superstore dataset
            dataset = 'rohitsahoo/sales-forecasting'
            self.api.dataset_download_files(dataset, path=self.data_path, unzip=True)
            print("[OK] Dataset downloaded successfully")
        except Exception as e:
            print(f"Kaggle download failed: {e}")
            print("Using alternative: Generating sample data")
            self._generate_sample_data()
    
    def load_data(self):
        """Load and return the dataset as DataFrame"""
        # Try multiple possible filenames
        possible_files = ['train.csv', 'sales.csv', 'data.csv']
        
        for filename in possible_files:
            filepath = os.path.join(self.data_path, filename)
            if os.path.exists(filepath):
                df = pd.read_csv(filepath)
                print(f"[OK] Loaded {filename}: {len(df)} rows")
                return df
        
        # If no file found, generate sample
        print("No dataset found, generating sample data")
        return self._generate_sample_data()
    
    def _generate_sample_data(self):
        """
        Generate realistic sample sales data
        Why: Fallback for demo/testing when Kaggle API unavailable
        """
        import numpy as np
        from datetime import datetime, timedelta
        
        np.random.seed(42)
        n_records = 10000  # Increased to 10,000 records for better analysis
        
        # Date range: 3 years of data
        start_date = datetime(2021, 1, 1)
        dates = [start_date + timedelta(days=int(x)) for x in np.random.randint(0, 1095, n_records)]
        
        # Products and categories
        products = ['Laptop', 'Phone', 'Tablet', 'Monitor', 'Keyboard', 'Mouse', 
                   'Headphones', 'Webcam', 'Printer', 'Router', 'Speaker', 'Charger',
                   'USB Cable', 'Hard Drive', 'SSD', 'RAM', 'Graphics Card', 'Motherboard']
        
        categories = {
            'Laptop': 'Technology', 'Phone': 'Technology', 'Tablet': 'Technology',
            'Monitor': 'Technology', 'Graphics Card': 'Technology', 'Motherboard': 'Technology',
            'Keyboard': 'Accessories', 'Mouse': 'Accessories', 'Headphones': 'Accessories',
            'Webcam': 'Accessories', 'Speaker': 'Accessories', 'Charger': 'Accessories',
            'USB Cable': 'Accessories', 'Printer': 'Office', 'Router': 'Office',
            'Hard Drive': 'Storage', 'SSD': 'Storage', 'RAM': 'Components'
        }
        
        regions = ['East', 'West', 'North', 'South', 'Central']
        
        # Generate product choices
        product_choices = np.random.choice(products, n_records)
        
        data = {
            'Order Date': dates,
            'Product': product_choices,
            'Category': [categories[p] for p in product_choices],
            'Sales': np.random.uniform(50, 5000, n_records).round(2),
            'Quantity': np.random.randint(1, 20, n_records),
            'Region': np.random.choice(regions, n_records),
            'Customer ID': [f'CUST{i:04d}' for i in np.random.randint(1, 1000, n_records)]
        }
        
        df = pd.DataFrame(data)
        # Calculate profit (15-45% margin with some variation)
        df['Profit'] = (df['Sales'] * np.random.uniform(0.15, 0.45, n_records)).round(2)
        
        # Save for future use
        df.to_csv(os.path.join(self.data_path, 'sales.csv'), index=False)
        print(f"[OK] Generated sample data: {len(df)} rows")
        return df


