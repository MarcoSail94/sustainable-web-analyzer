"""
Economics module for calculating financial impacts of web performance.
Determines costs, potential savings, and economic benefits of optimization.
"""

from config import Config

class EconomicAnalyzer:
    """
    Analyzes economic impacts of website performance.
    Calculates costs, savings, and ROI for optimizations.
    """

    def __init__(self, resource_data, sustainability_data, monthly_visits=None):
        """
        Initialize with resource and sustainability data.

        Args:
            resource_data: Data about page resources (sizes, counts, etc.)
            sustainability_data: Sustainability metrics
            monthly_visits: Estimated monthly visits to the site
        """
        self.resources = resource_data.get('resources', {})
        self.total_size = resource_data.get('total_size', 0)
        self.load_time = resource_data.get('load_time', 0)
        self.sustainability_score = sustainability_data.get('sustainability_score', 0)
        self.co2_emissions = sustainability_data.get('co2_emissions', 0)
        self.monthly_visits = monthly_visits or Config.DEFAULT_MONTHLY_VISITS

    def calculate_benefits(self):
        """
        Calculate economic benefits and potential savings.
        Returns a detailed breakdown of costs and savings.
        """
        total_mb = self.total_size / (1024 * 1024)

        # 1. Bandwidth cost (based on market rates)
        current_cost_per_visit = (total_mb / 1024) * Config.BANDWIDTH_COST_PER_GB  # € per visit
        monthly_bandwidth_cost = current_cost_per_visit * self.monthly_visits

        # 2. Data center energy costs
        energy_consumption_kwh = total_mb * Config.ENERGY_CONSUMPTION_PER_MB * self.monthly_visits
        monthly_energy_cost = energy_consumption_kwh * Config.ENERGY_COST_PER_KWH

        # 3. SEO impact and conversions
        avg_conversion_value = Config.AVERAGE_CONVERSION_VALUE
        conversion_rate = Config.AVERAGE_CONVERSION_RATE
        # Speed impact: 0.75% reduction in conversion rate for every 0.5s over 2s
        seo_penalty = max(0, (self.load_time - 2) / 0.5) * 0.0075

        potential_conversions = self.monthly_visits * conversion_rate
        lost_value_seo = potential_conversions * seo_penalty * avg_conversion_value

        # 4. Bounce rate impact
        # 7% increase in bounce rate per second over 3s
        bounce_increase = max(0, (self.load_time - 3) * 0.07)
        additional_bounces = self.monthly_visits * bounce_increase
        lost_value_bounce = additional_bounces * conversion_rate * avg_conversion_value

        # 5. Maintenance costs
        # 5% more time for each MB over 1MB
        excess_size_factor = max(0, (total_mb - 1)) * 0.05
        # Dev hours scaled based on site size
        base_monthly_dev_hours = min(10, max(4, total_mb * 1.5))
        additional_maintenance_cost = base_monthly_dev_hours * excess_size_factor * Config.HOURLY_DEV_RATE

        # 6. Infrastructure costs
        # Base infrastructure cost scaled by site size
        infrastructure_cost_base = min(100, max(40, total_mb * 20))
        # 3% increase per MB over 2MB
        infrastructure_penalty = max(0, (total_mb - 2)) * 0.03
        additional_infrastructure_cost = infrastructure_cost_base * infrastructure_penalty

        # Calculate total current monthly cost
        total_current_monthly_cost = (
                monthly_bandwidth_cost +
                monthly_energy_cost +
                lost_value_seo +
                lost_value_bounce +
                additional_maintenance_cost +
                additional_infrastructure_cost
        )

        # Calculate potential savings percentages based on sustainability score
        if self.sustainability_score < 50:
            potential_savings_percent = 0.30  # 30%
        elif self.sustainability_score < 80:
            potential_savings_percent = 0.20  # 20%
        else:
            potential_savings_percent = 0.08  # 8%

        # Detailed savings breakdown by category
        savings_detail = {
            "bandwidth": round(monthly_bandwidth_cost * potential_savings_percent, 2),
            "energy": round(monthly_energy_cost * potential_savings_percent, 2),
            "seo_conversions": round(lost_value_seo * 0.55, 2),  # 55% recovery
            "reduced_bounce": round(lost_value_bounce * 0.45, 2),  # 45% recovery
            "maintenance": round(additional_maintenance_cost * 0.65, 2),  # 65% recovery
            "infrastructure": round(additional_infrastructure_cost * 0.75, 2)  # 75% recovery
        }

        # Calculate total potential savings
        total_potential_savings = sum(savings_detail.values())

        # Prepare final economic benefits report
        return {
            "current_monthly_cost": round(total_current_monthly_cost, 2),
            "potential_savings_percent": int(100 * total_potential_savings / max(1, total_current_monthly_cost)),
            "potential_monthly_savings": round(total_potential_savings, 2),
            "potential_annual_savings": round(total_potential_savings * 12, 2),
            "bandwidth_cost_per_visit": round(current_cost_per_visit * 1000, 4),  # in cents
            "estimated_monthly_visits": self.monthly_visits,
            "savings_breakdown": savings_detail,
            "costs_breakdown": {
                "bandwidth": round(monthly_bandwidth_cost, 2),
                "energy": round(monthly_energy_cost, 2),
                "seo_impact": round(lost_value_seo, 2),
                "bounce_impact": round(lost_value_bounce, 2),
                "extra_maintenance": round(additional_maintenance_cost, 2),
                "extra_infrastructure": round(additional_infrastructure_cost, 2)
            }
        }

    def generate_comparison_data(self):
        """
        Generate industry comparison data.
        Returns metrics comparing the site to industry averages.
        """
        # Industry average values (could be dynamic in the future)
        avg_co2 = 0.6  # g CO2 per view
        avg_load_time = 2.5  # seconds
        avg_cost_saving = 120  # annual savings in euros

        # Calculate how the site compares to average
        better_than_percent = 65  # Default value

        # Calculate better_than_percent more accurately based on co2 and load time
        if self.co2_emissions < avg_co2 and self.load_time < avg_load_time:
            # Better than average on both metrics
            better_than_percent = 85
        elif self.co2_emissions < avg_co2 or self.load_time < avg_load_time:
            # Better than average on one metric
            better_than_percent = 65
        else:
            # Worse than average on both metrics
            better_than_percent = 35

        return {
            "better_than_percent": better_than_percent,
            "average_co2": avg_co2,
            "average_load_time": avg_load_time,
            "average_web_vitals": {
                "lcp": 2.8,  # seconds
                "fid": 120,  # milliseconds
                "cls": 0.15  # score
            },
            "average_cost_saving": avg_cost_saving
        }