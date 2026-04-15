"""Rule-based business advisor: generates ranked recommendations from sales data"""

class BusinessAdvisor:
    def __init__(self, df):
        self.df = df

    def _product_insights(self):
        insights = []
        if 'Product' not in self.df.columns:
            return insights

        product_stats = self.df.groupby('Product').agg(
            revenue=('Sales', 'sum'),
            profit=('Profit', 'sum'),
            orders=('Sales', 'count')
        )
        product_stats['margin'] = (product_stats['profit'] / product_stats['revenue'] * 100).round(1)
        avg_margin = product_stats['margin'].mean()
        avg_revenue = product_stats['revenue'].mean()

        # High revenue, low margin — pricing problem
        for product, row in product_stats.iterrows():
            if row['revenue'] > avg_revenue and row['margin'] < avg_margin * 0.75:
                insights.append({
                    'type': 'warning',
                    'category': 'Product',
                    'title': f'High Revenue, Low Margin: {product}',
                    'message': f'{product} generates strong revenue (${row["revenue"]:,.0f}) but its margin is only {row["margin"]:.1f}% — well below the {avg_margin:.1f}% average. Review supplier costs or adjust pricing.',
                    'action': f'Renegotiate supplier contract or increase price by 5–10% for {product}.',
                    'impact': 'high'
                })

        # Top performer — scale it
        top = product_stats.sort_values('revenue', ascending=False).iloc[0]
        insights.append({
            'type': 'opportunity',
            'category': 'Product',
            'title': f'Scale Top Performer: {top.name}',
            'message': f'{top.name} leads with ${top["revenue"]:,.0f} in revenue and {top["margin"]:.1f}% margin. This is your star product.',
            'action': f'Increase inventory and marketing spend for {top.name} heading into Q4.',
            'impact': 'high'
        })

        # Bottom performer — review
        bottom = product_stats.sort_values('revenue').iloc[0]
        if bottom['margin'] < 15:
            insights.append({
                'type': 'critical',
                'category': 'Product',
                'title': f'Underperformer at Risk: {bottom.name}',
                'message': f'{bottom.name} has the lowest revenue (${bottom["revenue"]:,.0f}) and a thin {bottom["margin"]:.1f}% margin. It may be dragging overall profitability.',
                'action': f'Consider discontinuing {bottom.name} or bundling it with high-margin products.',
                'impact': 'medium'
            })

        return insights

    def _region_insights(self):
        insights = []
        if 'Region' not in self.df.columns:
            return insights

        region_stats = self.df.groupby('Region').agg(
            revenue=('Sales', 'sum'),
            profit=('Profit', 'sum'),
            orders=('Sales', 'count')
        )
        region_stats['margin'] = (region_stats['profit'] / region_stats['revenue'] * 100).round(1)
        avg_revenue = region_stats['revenue'].mean()
        avg_margin = region_stats['margin'].mean()

        top_region = region_stats['revenue'].idxmax()
        bottom_region = region_stats['revenue'].idxmin()
        bottom_row = region_stats.loc[bottom_region]
        gap_pct = ((region_stats.loc[top_region, 'revenue'] - bottom_row['revenue']) / region_stats.loc[top_region, 'revenue'] * 100)

        insights.append({
            'type': 'warning',
            'category': 'Region',
            'title': f'Regional Gap: {top_region} vs {bottom_region}',
            'message': f'{bottom_region} is {gap_pct:.0f}% behind {top_region} in revenue. This gap signals untapped potential or structural issues in {bottom_region}.',
            'action': f'Deploy additional sales resources to {bottom_region}. Investigate pricing competitiveness and local demand.',
            'impact': 'high'
        })

        # Low margin region
        low_margin_regions = region_stats[region_stats['margin'] < avg_margin * 0.85]
        for region, row in low_margin_regions.iterrows():
            insights.append({
                'type': 'warning',
                'category': 'Region',
                'title': f'Low Margin Region: {region}',
                'message': f'{region} has a {row["margin"]:.1f}% profit margin vs the {avg_margin:.1f}% average. High discounting or operational costs may be the cause.',
                'action': f'Audit discount policies and operational costs in {region}.',
                'impact': 'medium'
            })

        return insights

    def _trend_insights(self):
        insights = []
        monthly = self.df.groupby('Year-Month')['Sales'].sum().sort_index()
        if len(monthly) < 3:
            return insights

        recent_3 = monthly.iloc[-3:].mean()
        prior_3 = monthly.iloc[-6:-3].mean() if len(monthly) >= 6 else monthly.iloc[:3].mean()

        if prior_3 > 0:
            trend_pct = ((recent_3 - prior_3) / prior_3 * 100)
            if trend_pct > 10:
                insights.append({
                    'type': 'opportunity',
                    'category': 'Trend',
                    'title': 'Strong Revenue Momentum',
                    'message': f'Revenue is up {trend_pct:.1f}% over the last 3 months vs the prior period. Momentum is building.',
                    'action': 'Lock in supplier contracts now to secure inventory for continued growth.',
                    'impact': 'high'
                })
            elif trend_pct < -10:
                insights.append({
                    'type': 'critical',
                    'category': 'Trend',
                    'title': 'Revenue Declining — Immediate Action Needed',
                    'message': f'Revenue has dropped {abs(trend_pct):.1f}% over the last 3 months. This is a significant downward trend.',
                    'action': 'Launch a targeted promotional campaign and review pricing strategy immediately.',
                    'impact': 'high'
                })

        # Seasonality check — Q4 vs Q1
        if 'Quarter' in self.df.columns:
            q4 = self.df[self.df['Quarter'] == 4]['Sales'].sum()
            q1 = self.df[self.df['Quarter'] == 1]['Sales'].sum()
            if q1 > 0 and q4 > q1 * 1.2:
                insights.append({
                    'type': 'opportunity',
                    'category': 'Trend',
                    'title': 'Q4 Seasonality Detected',
                    'message': f'Q4 revenue is {((q4/q1 - 1)*100):.0f}% higher than Q1. Your business has strong seasonal demand in Q4.',
                    'action': 'Begin Q4 inventory buildup in September. Pre-negotiate bulk supplier discounts.',
                    'impact': 'medium'
                })

        return insights

    def _profitability_insights(self):
        insights = []
        overall_margin = (self.df['Profit'].sum() / self.df['Sales'].sum() * 100)

        if overall_margin < 20:
            insights.append({
                'type': 'critical',
                'category': 'Profitability',
                'title': 'Overall Margin Below Healthy Threshold',
                'message': f'Your overall profit margin is {overall_margin:.1f}%. Healthy retail margins are typically 25–35%. This needs immediate attention.',
                'action': 'Conduct a full cost audit. Identify the top 3 cost drivers and target 5% reduction each.',
                'impact': 'high'
            })
        elif overall_margin > 30:
            insights.append({
                'type': 'opportunity',
                'category': 'Profitability',
                'title': 'Strong Profit Margins — Reinvest for Growth',
                'message': f'Your {overall_margin:.1f}% margin is above industry average. You have room to invest in growth.',
                'action': 'Allocate 10–15% of profits to marketing and new product development.',
                'impact': 'medium'
            })

        if 'Category' in self.df.columns:
            cat_stats = self.df.groupby('Category').agg(
                revenue=('Sales', 'sum'), profit=('Profit', 'sum')
            )
            cat_stats['margin'] = (cat_stats['profit'] / cat_stats['revenue'] * 100).round(1)
            best_cat = cat_stats['margin'].idxmax()
            worst_cat = cat_stats['margin'].idxmin()
            insights.append({
                'type': 'opportunity',
                'category': 'Profitability',
                'title': f'Best Category: {best_cat}',
                'message': f'{best_cat} has the highest margin at {cat_stats.loc[best_cat, "margin"]:.1f}%. Focus here for maximum profitability.',
                'action': f'Expand {best_cat} product range and increase its share of marketing budget.',
                'impact': 'medium'
            })
            if cat_stats.loc[worst_cat, 'margin'] < overall_margin * 0.7:
                insights.append({
                    'type': 'warning',
                    'category': 'Profitability',
                    'title': f'Weak Category: {worst_cat}',
                    'message': f'{worst_cat} margin is only {cat_stats.loc[worst_cat, "margin"]:.1f}% — significantly below average.',
                    'action': f'Review {worst_cat} pricing and consider reducing SKU count to focus on highest-margin items.',
                    'impact': 'medium'
                })

        return insights

    def generate_recommendations(self):
        recommendations = []
        recommendations.extend(self._trend_insights())
        recommendations.extend(self._profitability_insights())
        recommendations.extend(self._product_insights())
        recommendations.extend(self._region_insights())
        # Sort: critical first, then warning, then opportunity
        order = {'critical': 0, 'warning': 1, 'opportunity': 2}
        recommendations.sort(key=lambda x: order.get(x['type'], 3))
        return recommendations
