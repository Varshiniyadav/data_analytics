"""Analysis Module: Extract actionable business insights"""

import pandas as pd
import numpy as np

class BusinessAnalyzer:
    def __init__(self, df):
        self.df = df

    def revenue_trends(self):
        monthly = self.df.groupby('Year-Month').agg({
            'Sales': 'sum',
            'Profit': 'sum',
            'Order Date': 'count'
        }).rename(columns={'Order Date': 'Orders'})
        monthly['Profit Margin'] = (monthly['Profit'] / monthly['Sales'] * 100).round(2)
        monthly = monthly.reset_index()
        monthly['Revenue Growth %'] = monthly['Sales'].pct_change() * 100
        records = monthly.to_dict('records')
        for r in records:
            if r['Revenue Growth %'] != r['Revenue Growth %']:
                r['Revenue Growth %'] = None
        return records

    def product_performance(self):
        if 'Product' not in self.df.columns:
            return []
        products = self.df.groupby('Product').agg({
            'Sales': 'sum',
            'Profit': 'sum',
            'Order Date': 'count'
        }).rename(columns={'Order Date': 'Orders'})
        products['Profit Margin'] = (products['Profit'] / products['Sales'] * 100).round(2)
        products['Avg Order Value'] = (products['Sales'] / products['Orders']).round(2)
        return products.sort_values('Sales', ascending=False).reset_index().to_dict('records')

    def regional_analysis(self):
        if 'Region' not in self.df.columns:
            return []
        agg_dict = {'Sales': 'sum', 'Profit': 'sum', 'Order Date': 'count'}
        rename_dict = {'Order Date': 'Orders'}
        if 'Customer ID' in self.df.columns:
            agg_dict['Customer ID'] = 'nunique'
            rename_dict['Customer ID'] = 'Customers'
        regions = self.df.groupby('Region').agg(agg_dict).rename(columns=rename_dict)
        regions['Profit Margin'] = (regions['Profit'] / regions['Sales'] * 100).round(2)
        if 'Customers' in regions.columns:
            regions['Revenue Per Customer'] = (regions['Sales'] / regions['Customers']).round(2)
        else:
            regions['Customers'] = 0
            regions['Revenue Per Customer'] = 0
        return regions.sort_values('Sales', ascending=False).reset_index().to_dict('records')

    def profitability_analysis(self):
        if 'Category' in self.df.columns:
            category_profit = self.df.groupby('Category').agg({'Sales': 'sum', 'Profit': 'sum'})
            category_profit['Profit Margin'] = (category_profit['Profit'] / category_profit['Sales'] * 100).round(2)
            categories = category_profit.sort_values('Profit Margin', ascending=False).reset_index().to_dict('records')
        else:
            categories = []
        product_margins = self.df.groupby('Product')['Profit'].sum()
        loss_makers = product_margins[product_margins < 0].sort_values()
        return {
            'by_category': categories,
            'loss_making_products': loss_makers.to_dict() if len(loss_makers) > 0 else {},
            'overall_margin': float((self.df['Profit'].sum() / self.df['Sales'].sum() * 100).round(2))
        }

    def get_kpis(self):
        total_revenue = float(self.df['Sales'].sum())
        total_profit = float(self.df['Profit'].sum())
        years = self.df['Year'].unique()
        yoy_growth = 0
        if len(years) > 1:
            current_year = max(years)
            prev_year = current_year - 1
            current_revenue = self.df[self.df['Year'] == current_year]['Sales'].sum()
            prev_revenue = self.df[self.df['Year'] == prev_year]['Sales'].sum()
            if prev_revenue > 0:
                yoy_growth = ((current_revenue - prev_revenue) / prev_revenue * 100).round(2)
        return {
            'total_revenue': round(total_revenue, 2),
            'total_profit': round(total_profit, 2),
            'profit_margin': round((total_profit / total_revenue * 100), 2),
            'total_orders': int(len(self.df)),
            'avg_order_value': round(total_revenue / len(self.df), 2),
            'unique_customers': int(self.df['Customer ID'].nunique()) if 'Customer ID' in self.df.columns else 0,
            'yoy_growth': round(float(yoy_growth), 2)
        }

    def generate_insights(self):
        insights = []
        monthly = self.df.groupby('Year-Month')['Sales'].sum()
        peak_month = monthly.idxmax()
        peak_revenue = monthly.max()
        insights.append(f"Peak sales period: {peak_month} with ${peak_revenue:,.0f} in revenue")
        top_product = self.df.groupby('Product')['Sales'].sum().idxmax()
        top_product_revenue = self.df.groupby('Product')['Sales'].sum().max()
        insights.append(f"Top product: {top_product} generated ${top_product_revenue:,.0f}")
        avg_margin = (self.df['Profit'].sum() / self.df['Sales'].sum() * 100)
        insights.append(f"Overall profit margin: {avg_margin:.1f}%")
        if 'Region' in self.df.columns:
            top_region = self.df.groupby('Region')['Sales'].sum().idxmax()
            insights.append(f"Strongest region: {top_region}")
            bottom_region = self.df.groupby('Region')['Sales'].sum().idxmin()
            insights.append(f"Underperforming region: {bottom_region} needs attention")
        years = sorted(self.df['Year'].unique())
        if len(years) > 1:
            recent_growth = self.df.groupby('Year')['Sales'].sum().pct_change().iloc[-1] * 100
            trend = "growing" if recent_growth > 0 else "declining"
            insights.append(f"Revenue is {trend} at {abs(recent_growth):.1f}% year-over-year")
        return insights
