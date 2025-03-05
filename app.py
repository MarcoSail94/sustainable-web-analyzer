from flask import Flask, request, jsonify, render_template
import requests
from bs4 import BeautifulSoup
import re
import json
import time
from urllib.parse import urlparse
import statistics
import os
from concurrent.futures import ThreadPoolExecutor

app = Flask(__name__, static_folder='static', template_folder='templates')

class WebAnalyzer:
    def __init__(self, url):
        self.url = url
        self.domain = urlparse(url).netloc
        self.monthly_visits = 10000  # Default value, can be overridden
        self.resources = {
            'html': {'size': 0, 'count': 0},
            'css': {'size': 0, 'count': 0},
            'javascript': {'size': 0, 'count': 0},
            'images': {'size': 0, 'count': 0},
            'fonts': {'size': 0, 'count': 0},
            'other': {'size': 0, 'count': 0}
        }
        self.total_size = 0
        self.load_time = 0
        self.sustainability_score = 0
        self.co2_emissions = 0
        self.optimizations = []
        self.economic_benefits = {}

    def analyze(self):
        # Misura il tempo di caricamento
        start_time = time.time()

        try:
            # Aggiungi header per evitare blocchi
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }

            response = requests.get(self.url, headers=headers, timeout=10)
            response.raise_for_status()

            # Calcola il tempo di caricamento
            self.load_time = time.time() - start_time

            # Analizza il contenuto HTML
            self.analyze_html(response.text, response.headers)

            # Calcola il punteggio di sostenibilità
            self.calculate_metrics()

            # Genera suggerimenti per l'ottimizzazione
            self.generate_optimizations()

            return self.create_report()

        except requests.exceptions.RequestException as e:
            return {
                'success': False,
                'error': f"Errore durante l'analisi del sito: {str(e)}"
            }

    def analyze_html(self, html_content, headers):
        # Analizza la dimensione dell'HTML
        html_size = len(html_content)
        self.resources['html']['size'] = html_size
        self.resources['html']['count'] = 1
        self.total_size += html_size

        # Parse HTML with BeautifulSoup
        soup = BeautifulSoup(html_content, 'html.parser')

        # Analizza CSS incorporati
        style_tags = soup.find_all('style')
        for style in style_tags:
            if style.string:
                size = len(style.string)
                self.resources['css']['size'] += size
                self.resources['css']['count'] += 1
                self.total_size += size

        # Analizza JavaScript incorporati
        script_tags = soup.find_all('script')
        for script in script_tags:
            if script.string and not script.has_attr('src'):
                size = len(script.string)
                self.resources['javascript']['size'] += size
                self.resources['javascript']['count'] += 1
                self.total_size += size

        # Raccogli tutti i link esterni
        with ThreadPoolExecutor(max_workers=10) as executor:
            # Analizza CSS esterni
            css_links = soup.find_all('link', rel='stylesheet')
            for link in css_links:
                if link.get('href'):
                    executor.submit(self.analyze_external_resource, link.get('href'), 'css')

            # Analizza JavaScript esterni
            js_links = soup.find_all('script', src=True)
            for script in js_links:
                if script.get('src'):
                    executor.submit(self.analyze_external_resource, script.get('src'), 'javascript')

            # Analizza immagini
            img_tags = soup.find_all('img')
            for img in img_tags:
                if img.get('src'):
                    executor.submit(self.analyze_external_resource, img.get('src'), 'images')

            # Analizza fonts
            font_links = soup.find_all('link', rel=lambda x: x and 'font' in x)
            for font in font_links:
                if font.get('href'):
                    executor.submit(self.analyze_external_resource, font.get('href'), 'fonts')

    def analyze_external_resource(self, url, resource_type):
        try:
            # Gestisci URL relativi
            if url.startswith('//'):
                url = 'https:' + url
            elif not url.startswith(('http://', 'https://')):
                if url.startswith('/'):
                    url = f"https://{self.domain}{url}"
                else:
                    url = f"https://{self.domain}/{url}"

            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': '*/*',
                'Accept-Encoding': 'gzip, deflate, br',
                'Connection': 'keep-alive',
                'Referer': self.url
            }

            # Usa direttamente GET per evitare problemi con HEAD
            try:
                response = requests.get(url, headers=headers, timeout=5, stream=True)
                size = len(response.content)
            except requests.exceptions.RequestException as e:
                # In caso di errore, imposta una dimensione predefinita
                print(f"Errore nel recuperare {url}: {str(e)}")
                size = 0

            # Aggiorna le statistiche per il tipo di risorsa
            if resource_type in self.resources:
                self.resources[resource_type]['size'] += size
                self.resources[resource_type]['count'] += 1
                self.total_size += size
            else:
                # Usa 'other' se il tipo di risorsa non è valido
                self.resources['other']['size'] += size
                self.resources['other']['count'] += 1
                self.total_size += size

        except Exception as e:
            print(f"Errore nell'analizzare la risorsa {url}: {str(e)}")

    def calculate_metrics(self):
        # Calcoli esistenti per punteggio sostenibilità
        total_mb = self.total_size / (1024 * 1024)
        self.co2_emissions = round(total_mb * 0.2, 2)

        # Calcolo del punteggio di sostenibilità (invariato)
        score = 100
        if total_mb > 5:  # Più di 5MB
            score -= 30
        elif total_mb > 3:  # Tra 3 e 5MB
            score -= 20
        elif total_mb > 1:  # Tra 1 e 3MB
            score -= 10

        if self.load_time > 5:  # Più di 5 secondi
            score -= 30
        elif self.load_time > 3:  # Tra 3 e 5 secondi
            score -= 20
        elif self.load_time > 1:  # Tra 1 e 3 secondi
            score -= 10

        if self.resources['images']['count'] > 30:
            score -= 10

        if self.resources['javascript']['count'] > 20:
            score -= 10

        self.sustainability_score = max(0, min(100, score))

        # CALCOLI ECONOMICI MIGLIORATI CON VALORI REALISTICI
        monthly_visits = self.monthly_visits

        # 1. Costo larghezza di banda (ridotto a valori attuali di mercato)
        current_cost_per_visit = (total_mb / 1024) * 0.015  # €0.015 per GB (più realistico)
        monthly_bandwidth_cost = current_cost_per_visit * monthly_visits

        # 2. Costi energetici del data center (ridotto per riflettere l'efficienza moderna)
        energy_consumption_kwh = total_mb * 0.0002 * monthly_visits  # 0.0002 kWh per MB (più realistico)
        monthly_energy_cost = energy_consumption_kwh * 0.20  # €0.20 per kWh è realistico

        # 3. Impatto SEO e conversioni (valori più conservativi)
        avg_conversion_value = 25  # Valore medio di conversione in euro (leggermente ridotto)
        conversion_rate = 0.018  # 1.8% è un tasso di conversione medio più realistico
        # Riduzione dell'impatto della velocità (0.75% per ogni 0.5s oltre 2s)
        seo_penalty = max(0, (self.load_time - 2) / 0.5) * 0.0075

        potential_conversions = monthly_visits * conversion_rate
        lost_value_seo = potential_conversions * seo_penalty * avg_conversion_value

        # 4. Costo di abbandono (bounce rate con impatto più realistico)
        # 7% di aumento del bounce rate per secondo oltre 3s (invece di 10%)
        bounce_increase = max(0, (self.load_time - 3) * 0.07)
        additional_bounces = monthly_visits * bounce_increase
        lost_value_bounce = additional_bounces * conversion_rate * avg_conversion_value

        # 5. Costi di manutenzione (ridotto l'impatto delle dimensioni)
        # 5% in più di tempo per ogni MB extra oltre 1MB (invece di 10% per 500KB)
        excess_size_factor = max(0, (total_mb - 1)) * 0.05
        hourly_dev_rate = 45  # €45/ora è una tariffa media più realistica
        # Ore di manutenzione scalate in base alle dimensioni del sito
        base_monthly_dev_hours = min(10, max(4, total_mb * 1.5))
        additional_maintenance_cost = base_monthly_dev_hours * excess_size_factor * hourly_dev_rate

        # 6. Costi infrastruttura scalabile (ridotto l'impatto)
        # Base del costo infrastruttura scalato per dimensione del sito
        infrastructure_cost_base = min(100, max(40, total_mb * 20))
        # 3% di aumento per ogni MB oltre 2MB (invece di 5%)
        infrastructure_penalty = max(0, (total_mb - 2)) * 0.03
        additional_infrastructure_cost = infrastructure_cost_base * infrastructure_penalty

        # Calcolo del totale dei costi attuali
        total_current_monthly_cost = (
                monthly_bandwidth_cost +
                monthly_energy_cost +
                lost_value_seo +
                lost_value_bounce +
                additional_maintenance_cost +
                additional_infrastructure_cost
        )

        # Calcolo del potenziale risparmio (valori più conservativi)
        if self.sustainability_score < 50:
            potential_savings_percent = 0.30  # 30% invece di 40%
        elif self.sustainability_score < 80:
            potential_savings_percent = 0.20  # 20% invece di 25%
        else:
            potential_savings_percent = 0.08  # 8% invece di 10%

        # Dettaglio dei risparmi per categoria (percentuali di recupero più realistiche)
        savings_detail = {
            "bandwidth": round(monthly_bandwidth_cost * potential_savings_percent, 2),
            "energy": round(monthly_energy_cost * potential_savings_percent, 2),
            "seo_conversions": round(lost_value_seo * 0.55, 2),  # 55% di recupero invece di 70%
            "reduced_bounce": round(lost_value_bounce * 0.45, 2),  # 45% di recupero invece di 60%
            "maintenance": round(additional_maintenance_cost * 0.65, 2),  # 65% di recupero invece di 80%
            "infrastructure": round(additional_infrastructure_cost * 0.75, 2)  # 75% di recupero invece di 90%
        }

        # Calcolo totale dei risparmi potenziali
        total_potential_savings = sum(savings_detail.values())

        self.economic_benefits = {
            "current_monthly_cost": round(total_current_monthly_cost, 2),
            "potential_savings_percent": int(100 * total_potential_savings / max(1, total_current_monthly_cost)),
            "potential_monthly_savings": round(total_potential_savings, 2),
            "potential_annual_savings": round(total_potential_savings * 12, 2),
            "bandwidth_cost_per_visit": round(current_cost_per_visit * 1000, 4),  # in centesimi di euro
            "estimated_monthly_visits": monthly_visits,
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

    def generate_optimizations(self):
        # Analizza le risorse e genera suggerimenti di ottimizzazione

        # 1. Ottimizzazione immagini
        image_size_mb = self.resources['images']['size'] / (1024 * 1024)
        if image_size_mb > 1:
            potential_savings = round(image_size_mb * 0.6, 1)  # Stima: si può risparmiare il 60%
            self.optimizations.append({
                'title': 'Compressione delle Immagini',
                'description': f'Le immagini sono troppo pesanti. Puoi ridurre la dimensione complessiva di {potential_savings}MB (60%) utilizzando formati moderni come WebP e tecniche di compressione.',
                'priority': 'high' if image_size_mb > 2 else 'medium',
                'impact': round(potential_savings * 0.2, 2),  # CO2 risparmiata
                'resource_type': 'images',
                'economic_impact': round((potential_savings / (self.total_size / (1024 * 1024))) * self.economic_benefits["potential_annual_savings"], 2)
            })

        # 2. Ottimizzazione JavaScript
        js_size_mb = self.resources['javascript']['size'] / (1024 * 1024)
        if js_size_mb > 0.5:
            potential_savings = round(js_size_mb * 0.3, 1)  # Stima: si può risparmiare il 30%
            self.optimizations.append({
                'title': 'Minificazione JavaScript',
                'description': f'I file JavaScript possono essere ridotti di {int(potential_savings * 1024)}KB (30%) attraverso la minificazione e l\'eliminazione di codice inutilizzato.',
                'priority': 'high' if js_size_mb > 1 else 'medium',
                'impact': round(potential_savings * 0.2, 2),  # CO2 risparmiata
                'resource_type': 'javascript',
                'economic_impact': round((potential_savings / (self.total_size / (1024 * 1024))) * self.economic_benefits["potential_annual_savings"], 2)
            })

        # 3. Ottimizzazione CSS
        css_size_mb = self.resources['css']['size'] / (1024 * 1024)
        if css_size_mb > 0.2:
            potential_savings = round(css_size_mb * 0.4, 1)  # Stima: si può risparmiare il 40%
            self.optimizations.append({
                'title': 'Minificazione CSS',
                'description': f'I file CSS possono essere ridotti di {int(potential_savings * 1024)}KB (40%) attraverso la minificazione e l\'eliminazione di regole inutilizzate.',
                'priority': 'medium',
                'impact': round(potential_savings * 0.2, 2),  # CO2 risparmiata
                'resource_type': 'css',
                'economic_impact': round((potential_savings / (self.total_size / (1024 * 1024))) * self.economic_benefits["potential_annual_savings"], 2)
            })

        # 4. Suggerimento CDN (sempre consigliato)
        self.optimizations.append({
            'title': 'Utilizzo della CDN',
            'description': 'L\'implementazione di una CDN (Content Delivery Network) potrebbe ridurre le emissioni di CO₂ del 16% grazie alla distribuzione geografica ottimizzata.',
            'priority': 'low',
            'impact': round(self.co2_emissions * 0.16, 2),  # CO2 risparmiata: 16% del totale
            'resource_type': 'general',
            'economic_impact': round(self.economic_benefits["potential_annual_savings"] * 0.16, 2)
        })

        # 5. Hosting Green (sempre consigliato)
        self.optimizations.append({
            'title': 'Hosting Green',
            'description': 'Passare a un provider di hosting che utilizza energia rinnovabile potrebbe ridurre l\'impronta di carbonio del tuo sito web fino al 40%.',
            'priority': 'low',
            'impact': round(self.co2_emissions * 0.4, 2),  # CO2 risparmiata: 40% del totale
            'resource_type': 'general',
            'economic_impact': round(self.economic_benefits["potential_annual_savings"] * 0.10, 2)  # Minor impatto economico ma grande impatto ecologico
        })

        # 6. Nuova ottimizzazione: Font Web
        font_size_mb = self.resources['fonts']['size'] / (1024 * 1024)
        if font_size_mb > 0.1:
            potential_savings = round(font_size_mb * 0.5, 1)  # Stima: si può risparmiare il 50%
            self.optimizations.append({
                'title': 'Ottimizzazione Font Web',
                'description': f'I font web aggiungono {round(font_size_mb, 1)}MB al tuo sito. Considera l\'uso di font di sistema o subset di caratteri per ridurre il peso del 50%.',
                'priority': 'medium' if font_size_mb > 0.3 else 'low',
                'impact': round(potential_savings * 0.2, 2),
                'resource_type': 'fonts',
                'economic_impact': round((potential_savings / (self.total_size / (1024 * 1024))) * self.economic_benefits["potential_annual_savings"], 2)
            })

        # 7. Nuova ottimizzazione: HTTP/2 o HTTP/3
        self.optimizations.append({
            'title': 'Aggiornamento Protocollo HTTP',
            'description': 'L\'utilizzo di HTTP/2 o HTTP/3 può ridurre il tempo di caricamento fino al 30% riducendo la latenza e ottimizzando le connessioni.',
            'priority': 'medium',
            'impact': round(self.co2_emissions * 0.15, 2),
            'resource_type': 'general',
            'economic_impact': round(self.economic_benefits["potential_annual_savings"] * 0.15, 2)
        })

        # 8. Nuova ottimizzazione: Riduzione script di terze parti
        if self.resources['javascript']['count'] > 5:
            self.optimizations.append({
                'title': 'Riduzione Script di Terze Parti',
                'description': f'Il tuo sito utilizza {self.resources["javascript"]["count"]} script. Riducendo gli script di analytics, social media e pubblicità si può migliorare notevolmente il caricamento.',
                'priority': 'high' if self.resources['javascript']['count'] > 10 else 'medium',
                'impact': round(self.co2_emissions * 0.2, 2),
                'resource_type': 'javascript',
                'economic_impact': round(self.economic_benefits["costs_breakdown"]["bounce_impact"] * 0.4, 2) # 40% dell'impatto del bounce rate
            })

    def create_report(self):
        # Converti i byte in formato più leggibile
        resources_formatted = {}
        for key, value in self.resources.items():
            # Converti dimensione da byte a KB o MB
            size_bytes = value['size']
            if size_bytes > 1024 * 1024:
                size_formatted = f"{round(size_bytes / (1024 * 1024), 2)} MB"
            else:
                size_formatted = f"{round(size_bytes / 1024)} KB"

            resources_formatted[key] = {
                'size': size_formatted,
                'size_bytes': size_bytes,
                'count': value['count'],
                'co2': round((size_bytes / (1024 * 1024)) * 0.2, 2)  # CO2 in grammi
            }

        # Formatta dimensione totale
        if self.total_size > 1024 * 1024:
            total_size_formatted = f"{round(self.total_size / (1024 * 1024), 2)} MB"
        else:
            total_size_formatted = f"{round(self.total_size / 1024)} KB"

        # Crea la risposta
        report = {
            'success': True,
            'url': self.url,
            'domain': self.domain,
            'metrics': {
                'sustainability_score': self.sustainability_score,
                'co2_emissions': self.co2_emissions,
                'total_size': total_size_formatted,
                'total_size_bytes': self.total_size,
                'load_time': round(self.load_time, 2),
                'economic_benefits': self.economic_benefits
            },
            'resources': resources_formatted,
            'optimizations': self.optimizations,
            'industry_comparison': {
                'better_than_percent': 65,  # Valore di esempio
                'average_co2': 0.6,  # Valore di esempio
                'average_load_time': 2.5,  # Valore di esempio
                'average_cost_saving': 120  # Valore medio di risparmio annuale in euro
            }
        }

        return report

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/analyze', methods=['POST'])
def analyze():
    try:
        data = request.get_json()
        url = data.get('url')
        monthly_visits = data.get('monthly_visits', 10000)  # Default a 10000 se non specificato

        # Valida il numero di visite mensili
        try:
            monthly_visits = int(monthly_visits)
            if monthly_visits <= 0:
                monthly_visits = 10000
        except (ValueError, TypeError):
            monthly_visits = 10000

        if not url:
            return jsonify({'success': False, 'error': 'URL non specificato'}), 400

        # Valida URL
        if not url.startswith(('http://', 'https://')):
            url = 'https://' + url

        # Esegui l'analisi con il parametro visite mensili
        analyzer = WebAnalyzer(url)
        analyzer.monthly_visits = monthly_visits  # Imposta il valore personalizzato
        result = analyzer.analyze()

        return jsonify(result)

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='127.0.0.1', port=int(os.environ.get('PORT', 8080)))