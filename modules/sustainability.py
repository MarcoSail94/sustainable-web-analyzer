"""
Sustainability module for calculating environmental impact metrics.
Includes CO2 emissions calculations and sustainability scoring.
"""

from config import Config

class SustainabilityAnalyzer:
    """
    Analyzes website sustainability and environmental impact.
    Calculates metrics like CO2 emissions and sustainability scores.
    """

    def __init__(self, resource_data, web_vitals_data=None):
        """
        Initialize with resource data and optional web vitals data.

        Args:
            resource_data: Data about page resources (sizes, counts, etc.)
            web_vitals_data: Optional Core Web Vitals measurements
        """
        self.resources = resource_data.get('resources', {})
        self.total_size = resource_data.get('total_size', 0)
        self.load_time = resource_data.get('load_time', 0)
        self.web_vitals = web_vitals_data or {}
        self.sustainability_score = 0
        self.co2_emissions = 0

    def calculate_metrics(self):
        """
        Calculate sustainability metrics and scores.
        Returns a dictionary of calculated metrics.
        """
        # Calculate CO2 emissions based on total transfer size
        total_mb = self.total_size / (1024 * 1024)
        self.co2_emissions = round(total_mb * Config.CO2_PER_MB, 2)

        # Calculate the sustainability score
        self._calculate_sustainability_score()

        # Format metrics for return
        if self.total_size > 1024 * 1024:
            total_size_formatted = f"{round(self.total_size / (1024 * 1024), 2)} MB"
        else:
            total_size_formatted = f"{round(self.total_size / 1024)} KB"

        return {
            'sustainability_score': self.sustainability_score,
            'co2_emissions': self.co2_emissions,
            'total_size': total_size_formatted,
            'total_size_bytes': self.total_size,
            'load_time': round(self.load_time, 2)
        }

    def _calculate_sustainability_score(self):
        """Calculate the overall sustainability score from 0-100."""
        # Start with a perfect score and subtract points based on issues
        score = 100

        # Size factors (20% of score)
        total_mb = self.total_size / (1024 * 1024)
        if total_mb > 5:  # More than 5MB
            score -= 20
        elif total_mb > 3:  # Between 3-5MB
            score -= 12
        elif total_mb > 1:  # Between 1-3MB
            score -= 6

        # Load time factors (20% of score)
        if self.load_time > 5:  # More than 5 seconds
            score -= 20
        elif self.load_time > 3:  # Between 3-5 seconds
            score -= 12
        elif self.load_time > 1:  # Between 1-3 seconds
            score -= 6

        # Resource count factors (10% of score)
        resource_counts = {k: v.get('count', 0) for k, v in self.resources.items()}
        if resource_counts.get('images', 0) > 30:
            score -= 5

        if resource_counts.get('javascript', 0) > 20:
            score -= 5

        # Web Vitals factors (50% of score)
        web_vitals_score = self.web_vitals.get('scores', {}).get('overall', 0)

        # If we have Web Vitals measurements, integrate the score
        if web_vitals_score > 0:
            # Apply Web Vitals as 50% of the overall score
            score = (score * 0.5) + (web_vitals_score * 0.5)

        # Ensure score is between 0-100
        self.sustainability_score = max(0, min(100, int(score)))

    def generate_optimizations(self):
        """
        Generate optimization suggestions based on resource analysis.
        Returns a list of optimization opportunities.
        """
        optimizations = []

        # 1. Image optimization
        image_size_mb = self.resources.get('images', {}).get('size_bytes', 0) / (1024 * 1024)
        if image_size_mb > 1:
            potential_savings = round(image_size_mb * 0.6, 1)  # Estimate: can save 60%
            optimizations.append({
                'title': 'Compressione Immagini',
                'description': f'Le immagini sono troppo pesanti. Puoi ridurre la dimensione complessiva di {potential_savings}MB (60%) utilizzando formati moderni come WebP e tecniche di compressione.',
                'priority': 'high' if image_size_mb > 2 else 'medium',
                'impact': round(potential_savings * 0.2, 2),  # CO2 saved
                'resource_type': 'images',
                'economic_impact': round((potential_savings / (self.total_size / (1024 * 1024))) * 18.72, 2)  # Estimated based on average savings
            })

        # 2. JavaScript optimization
        js_size_mb = self.resources.get('javascript', {}).get('size_bytes', 0) / (1024 * 1024)
        if js_size_mb > 0.5:
            potential_savings = round(js_size_mb * 0.3, 1)  # Estimate: can save 30%
            optimizations.append({
                'title': 'Minificazione JavaScript',
                'description': f'I file JavaScript possono essere ridotti di {int(potential_savings * 1024)}KB (30%) attraverso la minificazione e l\'eliminazione del codice inutilizzato.',
                'priority': 'high' if js_size_mb > 1 else 'medium',
                'impact': round(potential_savings * 0.2, 2),  # CO2 saved
                'resource_type': 'javascript',
                'economic_impact': round((potential_savings / (self.total_size / (1024 * 1024))) * 18.72, 2)
            })

        # 3. CSS optimization
        css_size_mb = self.resources.get('css', {}).get('size_bytes', 0) / (1024 * 1024)
        if css_size_mb > 0.2:
            potential_savings = round(css_size_mb * 0.4, 1)  # Estimate: can save 40%
            optimizations.append({
                'title': 'Minificazione CSS',
                'description': f'I file CSS possono essere ridotti di {int(potential_savings * 1024)}KB (40%) attraverso la minificazione e l\'eliminazione delle regole inutilizzate.',
                'priority': 'medium',
                'impact': round(potential_savings * 0.2, 2),  # CO2 saved
                'resource_type': 'css',
                'economic_impact': round((potential_savings / (self.total_size / (1024 * 1024))) * 18.72, 2)
            })

        # 4. CDN suggestion (always recommended)
        optimizations.append({
            'title': 'Implementazione CDN',
            'description': 'L\'implementazione di una Content Delivery Network (CDN) potrebbe ridurre le emissioni di CO₂ del 16% attraverso una distribuzione geografica ottimizzata.',
            'priority': 'low',
            'impact': round(self.co2_emissions * 0.16, 2),  # CO2 saved: 16% of total
            'resource_type': 'general',
            'economic_impact': round(18.72 * 0.16, 2)  # 16% of average annual savings
        })

        # 5. Green hosting (always recommended)
        optimizations.append({
            'title': 'Green Hosting',
            'description': 'Passare a un provider di hosting che utilizza energia rinnovabile potrebbe ridurre l\'impronta di carbonio del tuo sito fino al 40%.',
            'priority': 'low',
            'impact': round(self.co2_emissions * 0.4, 2),  # CO2 saved: 40% of total
            'resource_type': 'general',
            'economic_impact': round(18.72 * 0.10, 2)  # Lower economic impact but big ecological impact
        })

        # 6. Web Fonts optimization
        font_size_mb = self.resources.get('fonts', {}).get('size_bytes', 0) / (1024 * 1024)
        if font_size_mb > 0.1:
            potential_savings = round(font_size_mb * 0.5, 1)  # Estimate: can save 50%
            optimizations.append({
                'title': 'Ottimizzazione Web Font',
                'description': f'I web font aggiungono {round(font_size_mb, 1)}MB al tuo sito. Considera l\'utilizzo di font di sistema o subset di caratteri per ridurre il peso del 50%.',
                'priority': 'medium' if font_size_mb > 0.3 else 'low',
                'impact': round(potential_savings * 0.2, 2),
                'resource_type': 'fonts',
                'economic_impact': round((potential_savings / (self.total_size / (1024 * 1024))) * 18.72, 2)
            })

        # 7. HTTP/2 or HTTP/3 suggestion
        optimizations.append({
            'title': 'Aggiornamento Protocollo HTTP',
            'description': 'L\'utilizzo di HTTP/2 o HTTP/3 può ridurre il tempo di caricamento fino al 30% riducendo la latenza e ottimizzando le connessioni.',
            'priority': 'medium',
            'impact': round(self.co2_emissions * 0.15, 2),
            'resource_type': 'general',
            'economic_impact': round(18.72 * 0.15, 2)
        })

        # 8. Third-party script reduction
        js_count = self.resources.get('javascript', {}).get('count', 0)
        if js_count > 5:
            optimizations.append({
                'title': 'Riduzione Script di Terze Parti',
                'description': f'Il tuo sito utilizza {js_count} script. Ridurre gli script di analytics, social media e pubblicità può migliorare significativamente il tempo di caricamento.',
                'priority': 'high' if js_count > 10 else 'medium',
                'impact': round(self.co2_emissions * 0.2, 2),
                'resource_type': 'javascript',
                'economic_impact': round(18.72 * 0.2, 2)
            })

        # Add Web Vitals based optimizations if available
        self._add_web_vitals_optimizations(optimizations)

        return optimizations

    def _add_web_vitals_optimizations(self, optimizations):
        """Add optimizations based on Web Vitals measurements."""
        # LCP optimization
        if self.web_vitals.get('lcp', 0) > 2500:  # LCP > 2.5s
            optimizations.append({
                'title': 'Migliorare LCP (Largest Contentful Paint)',
                'description': f'LCP è {self.web_vitals["lcp"]/1000:.2f}s, sopra la soglia raccomandata di 2.5s. Ottimizza il rendering dei contenuti principali precaricando le risorse critiche e posticipando quelle non essenziali.',
                'priority': 'high' if self.web_vitals['lcp'] > 4000 else 'medium',
                'impact': round(self.co2_emissions * 0.15, 2),  # 15% CO2 savings
                'resource_type': 'performance',
                'economic_impact': round(18.72 * 0.15, 2)
            })

        # Interactivity optimization
        if self.web_vitals.get('fid', 0) > 100:  # FID > 100ms
            optimizations.append({
                'title': 'Migliorare l\'interattività della pagina',
                'description': f'La reattività misurata è {self.web_vitals["fid"]:.2f}ms, sopra la soglia raccomandata di 100ms. Riduci il JavaScript bloccante e suddividi le attività lunghe per migliorare le interazioni.',
                'priority': 'high' if self.web_vitals['fid'] > 300 else 'medium',
                'impact': round(self.co2_emissions * 0.1, 2),  # 10% CO2 savings
                'resource_type': 'performance',
                'economic_impact': round(18.72 * 0.1, 2)
            })

        # CLS optimization
        if self.web_vitals.get('cls', 0) > 0.1:  # CLS > 0.1
            optimizations.append({
                'title': 'Migliorare CLS (Cumulative Layout Shift)',
                'description': f'CLS è {self.web_vitals["cls"]:.3f}, sopra la soglia raccomandata di 0.1. Specifica le dimensioni per immagini e video, evita l\'inserimento di contenuti dinamici e utilizza schermate scheletro.',
                'priority': 'high' if self.web_vitals['cls'] > 0.25 else 'medium',
                'impact': round(self.co2_emissions * 0.08, 2),  # 8% CO2 savings
                'resource_type': 'performance',
                'economic_impact': round(18.72 * 0.12, 2)
            })
