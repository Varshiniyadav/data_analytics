"""
What-If Simulator
Purpose: Simulate the financial impact of business decisions before committing
Why: Managers need to test pricing/discount changes without real-world risk
"""

class DecisionSimulator:
    def __init__(self, df):
        self.df = df
        self.base_revenue = float(df['Sales'].sum())
        self.base_profit = float(df['Profit'].sum())
        self.base_margin = (self.base_profit / self.base_revenue * 100) if self.base_revenue > 0 else 0
        self.total_orders = len(df)

    def simulate(self, price_change_pct: float, discount_pct: float, volume_change_pct: float):
        """
        Simulate impact of price, discount, and volume changes.

        Args:
            price_change_pct: % change in price (e.g. 10 = +10%)
            discount_pct: additional discount applied (e.g. 5 = 5% off)
            volume_change_pct: % change in sales volume (e.g. -5 = 5% fewer orders)

        Returns:
            dict with simulated metrics and impact analysis
        """
        price_multiplier = 1 + (price_change_pct / 100)
        discount_multiplier = 1 - (discount_pct / 100)
        volume_multiplier = 1 + (volume_change_pct / 100)

        # Net revenue per unit changes with price and discount
        net_price_multiplier = price_multiplier * discount_multiplier

        sim_revenue = self.base_revenue * net_price_multiplier * volume_multiplier

        # Costs are driven by volume only (not price)
        base_cost = self.base_revenue - self.base_profit
        sim_cost = base_cost * volume_multiplier
        sim_profit = sim_revenue - sim_cost
        sim_margin = (sim_profit / sim_revenue * 100) if sim_revenue > 0 else 0

        revenue_delta = sim_revenue - self.base_revenue
        profit_delta = sim_profit - self.base_profit
        margin_delta = sim_margin - self.base_margin

        # Determine overall impact level
        profit_change_pct = (profit_delta / self.base_profit * 100) if self.base_profit > 0 else 0
        if profit_change_pct > 10:
            impact_level = 'positive'
        elif profit_change_pct < -10:
            impact_level = 'negative'
        else:
            impact_level = 'neutral'

        # Generate a plain-English explanation
        explanation = self._explain(price_change_pct, discount_pct, volume_change_pct,
                                    revenue_delta, profit_delta, profit_change_pct)

        return {
            'base': {
                'revenue': round(self.base_revenue, 2),
                'profit': round(self.base_profit, 2),
                'margin': round(self.base_margin, 2),
            },
            'simulated': {
                'revenue': round(sim_revenue, 2),
                'profit': round(sim_profit, 2),
                'margin': round(sim_margin, 2),
            },
            'delta': {
                'revenue': round(revenue_delta, 2),
                'profit': round(profit_delta, 2),
                'margin': round(margin_delta, 2),
                'profit_change_pct': round(profit_change_pct, 2),
            },
            'impact_level': impact_level,
            'explanation': explanation,
        }

    def _explain(self, price_chg, discount, volume_chg, rev_delta, profit_delta, profit_pct):
        parts = []
        if price_chg != 0:
            direction = 'increase' if price_chg > 0 else 'decrease'
            parts.append(f'A {abs(price_chg):.0f}% price {direction}')
        if discount != 0:
            parts.append(f'a {discount:.0f}% discount')
        if volume_chg != 0:
            direction = 'increase' if volume_chg > 0 else 'decrease'
            parts.append(f'a {abs(volume_chg):.0f}% volume {direction}')

        if not parts:
            return 'No changes applied. Showing baseline performance.'

        summary = ', combined with '.join(parts)
        direction = 'increase' if profit_delta >= 0 else 'decrease'
        return (
            f'{summary} would {direction} profit by ${abs(profit_delta):,.0f} '
            f'({abs(profit_pct):.1f}%). '
            f'{"This is a net positive move." if profit_delta >= 0 else "Reconsider this combination — it erodes profitability."}'
        )
