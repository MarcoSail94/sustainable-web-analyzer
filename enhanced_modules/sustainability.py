"""
Sustainability module migliorato per calcolare metriche di impatto ambientale
utilizzando i dati avanzati di Lighthouse.
"""

from config import Config

class EnhancedSustainabilityAnalyzer:
    """
    Analizzatore di sostenibilità migliorato che incorpora le metriche
    dettagliate di Lighthouse per valutazioni più precise.
    """

    def __init__(self, resource_data, web_vitals_data=None):
        """
        Inizializza con i dati delle risorse e dati web vitals opzionali.

        Args:
            resource_data: Dati sulle risorse della pagina (dimensioni, conteggi, ecc.)
            web_vitals_data: Dati opzionali di Core Web Vitals estesi da Lighthouse
        """
        self.resources = resource_data.get('resources', {})
        self.total_size = resource_data.get('total_size', 0)
        self.load_time = resource_data.get('load_time', 0)
        self.web_vitals = web_vitals_data or {}
        self.sustainability_score = 0
        self.co2_emissions = 0

        # Flag per verificare se stiamo usando Lighthouse Enhanced
        self.using_lighthouse_enhanced = web_vitals_data and web_vitals_data.get('analyzer_type') == 'lighthouse-enhanced'

    def calculate_metrics(self):
        """
        Calcola metriche di sostenibilità e punteggi usando tutti i dati disponibili.
        Restituisce un dizionario di metriche calcolate.
        """
        # Calcola le emissioni di CO2 in base alla dimensione totale del trasferimento
        total_mb = self.total_size / (1024 * 1024)
        self.co2_emissions = round(total_mb * Config.CO2_PER_MB, 2)

        # Calcola il punteggio di sostenibilità
        self._calculate_enhanced_sustainability_score()

        # Formatta metriche per il ritorno
        if self.total_size > 1024 * 1024:
            total_size_formatted = f"{round(self.total_size / (1024 * 1024), 2)} MB"
        else:
            total_size_formatted = f"{round(self.total_size / 1024)} KB"

        # Crea il dizionario base delle metriche
        metrics = {
            'sustainability_score': self.sustainability_score,
            'co2_emissions': self.co2_emissions,
            'total_size': total_size_formatted,
            'total_size_bytes': self.total_size,
            'load_time': round(self.load_time, 2)
        }

        # Aggiungi metriche di efficienza energetica se disponibili
        if self.using_lighthouse_enhanced:
            # Recupera metriche di efficienza dal rapporto Lighthouse
            energy_metrics = self.web_vitals.get('energy_metrics', {})

            # Calcola un punteggio di efficienza energetica
            energy_efficiency_score = 0

            # Ottieni punteggi di ottimizzazione che influenzano l'efficienza
            optimization_scores = self.web_vitals.get('optimization_scores', {})
            if optimization_scores:
                # Pondera i fattori che maggiormente influenzano l'efficienza energetica
                energy_efficiency_score = (
                                                  (optimization_scores.get('compress_images', 0.5) * 0.2) +
                                                  (optimization_scores.get('next_gen_images', 0.5) * 0.2) +
                                                  (optimization_scores.get('text_compression', 0.5) * 0.1) +
                                                  (optimization_scores.get('js_optimization', 0.5) * 0.3) +
                                                  (optimization_scores.get('cache_policy', 0.5) * 0.1) +
                                                  (optimization_scores.get('http2', 0.5) * 0.1)
                                          ) * 100

            # Calcola una stima di kWh per visita
            estimated_kwh = total_mb * Config.ENERGY_CONSUMPTION_PER_MB

            # Aggiungi le metriche di efficienza energetica
            metrics['energy_efficiency'] = {
                'score': round(energy_efficiency_score, 1),
                'estimated_kwh_per_view': round(estimated_kwh, 6),
                'estimated_yearly_kwh': round(estimated_kwh * Config.DEFAULT_MONTHLY_VISITS * 12, 2),
                'optimization_impacts': {
                    'images': round(optimization_scores.get('compress_images', 0.5) * 100),
                    'next_gen_formats': round(optimization_scores.get('next_gen_images', 0.5) * 100),
                    'text_compression': round(optimization_scores.get('text_compression', 0.5) * 100),
                    'js_optimization': round(optimization_scores.get('js_optimization', 0.5) * 100),
                    'caching': round(optimization_scores.get('cache_policy', 0.5) * 100),
                    'http2': round(optimization_scores.get('http2', 0.5) * 100)
                }
            }

            # Aggiungi metriche di accessibilità che influenzano indirettamente l'efficienza
            accessibility_score = self.web_vitals.get('accessibility_score', 0)
            if accessibility_score > 0:
                metrics['accessibility'] = {
                    'score': accessibility_score,
                    'sustainability_impact': 'Migliore accessibilità riduce il consumo energetico permettendo agli utenti di completare le azioni più velocemente'
                }

            # Aggiungi una stima del carbon footprint annuale
            metrics['yearly_carbon_footprint'] = {
                'kg_co2': round((self.co2_emissions / 1000) * Config.DEFAULT_MONTHLY_VISITS * 12, 2),
                'equivalent_trees': round(((self.co2_emissions / 1000) * Config.DEFAULT_MONTHLY_VISITS * 12) / 21, 1),  # Un albero assorbe circa 21 kg di CO2 all'anno
                'comparison': {
                    'car_km': round(((self.co2_emissions / 1000) * Config.DEFAULT_MONTHLY_VISITS * 12) / 0.12, 1),  # 0.12 kg CO2 per km
                    'smartphone_charges': round(((self.co2_emissions / 1000) * Config.DEFAULT_MONTHLY_VISITS * 12) / 0.005, 0),  # 5g CO2 per carica
                }
            }

        return metrics

    def _calculate_enhanced_sustainability_score(self):
        """Calcola il punteggio di sostenibilità complessivo (0-100) utilizzando tutte le metriche disponibili."""
        # Inizia con un punteggio perfetto e sottrai punti in base ai problemi
        score = 100

        # 1. Fattori di dimensione (15% del punteggio)
        total_mb = self.total_size / (1024 * 1024)
        if total_mb > 5:  # Più di 5MB
            score -= 15
        elif total_mb > 3:  # Tra 3-5MB
            score -= 9
        elif total_mb > 1:  # Tra 1-3MB
            score -= 4.5

        # 2. Fattori di tempo di caricamento (15% del punteggio)
        if self.load_time > 5:  # Più di 5 secondi
            score -= 15
        elif self.load_time > 3:  # Tra 3-5 secondi
            score -= 9
        elif self.load_time > 1:  # Tra 1-3 secondi
            score -= 4.5

        # 3. Conteggio delle risorse (10% del punteggio)
        resource_counts = {k: v.get('count', 0) for k, v in self.resources.items()}
        total_resources = sum(resource_counts.values())

        if total_resources > 80:
            score -= 10
        elif total_resources > 50:
            score -= 6
        elif total_resources > 30:
            score -= 3

        # 4. Se utilizziamo Lighthouse Enhanced, incorpora metriche avanzate (60% restante)
        if self.using_lighthouse_enhanced:
            # A. Punteggio Core Web Vitals (20% del punteggio)
            web_vitals_score = self.web_vitals.get('scores', {}).get('overall', 0)
            if web_vitals_score > 0:
                web_vitals_contribution = web_vitals_score * 0.2
                score -= 20  # Rimuovi il 20% massimo...
                score += web_vitals_contribution  # ...e aggiungi il contributo effettivo

            # B. Punteggio di ottimizzazione delle risorse (15% del punteggio)
            optimization_scores = self.web_vitals.get('optimization_scores', {})
            if optimization_scores:
                # Calcola punteggio medio di ottimizzazione (su 100)
                avg_optimization = (
                                           (optimization_scores.get('compress_images', 0.5) * 100) +
                                           (optimization_scores.get('next_gen_images', 0.5) * 100) +
                                           (optimization_scores.get('text_compression', 0.5) * 100) +
                                           (optimization_scores.get('js_optimization', 0.5) * 100) +
                                           (optimization_scores.get('cache_policy', 0.5) * 100) +
                                           (optimization_scores.get('http2', 0.5) * 100)
                                   ) / 6

                optimization_contribution = avg_optimization * 0.15 / 100
                score -= 15  # Rimuovi il 15% massimo...
                score += optimization_contribution  # ...e aggiungi il contributo effettivo

            # C. Peso totale dei byte (10% del punteggio)
            total_byte_weight = self.web_vitals.get('total_byte_weight', 0) / (1024 * 1024)
            if total_byte_weight > 5:
                score -= 10
            elif total_byte_weight > 3:
                score -= 6
            elif total_byte_weight > 1:
                score -= 3

            # D. Accessibilità (5% del punteggio) - l'accessibilità contribuisce anche alla sostenibilità
            accessibility_score = self.web_vitals.get('accessibility_score', 0)
            accessibility_contribution = accessibility_score * 0.05 / 100
            score -= 5  # Rimuovi il 5% massimo...
            score += accessibility_contribution  # ...e aggiungi il contributo effettivo

            # E. Best Practices (5% del punteggio)
            best_practices_score = self.web_vitals.get('best_practices_score', 0)
            best_practices_contribution = best_practices_score * 0.05 / 100
            score -= 5  # Rimuovi il 5% massimo...
            score += best_practices_contribution  # ...e aggiungi il contributo effettivo

            # F. Parametri JS (5% del punteggio)
            performance_metrics = self.web_vitals.get('performance_metrics', {})
            bootup_time = performance_metrics.get('bootup_time', 0)
            if bootup_time > 1000:
                score -= 5
            elif bootup_time > 500:
                score -= 3
            elif bootup_time > 250:
                score -= 1.5

        else:
            # Se non utilizziamo Lighthouse Enhanced, usa l'approccio standard
            web_vitals_score = self.web_vitals.get('scores', {}).get('overall', 0)
            if web_vitals_score > 0:
                # Applica Web Vitals come 60% del punteggio complessivo
                score = (score * 0.4) + (web_vitals_score * 0.6)

        # Assicurati che il punteggio sia tra 0-100
        self.sustainability_score = max(0, min(100, int(score)))

    def generate_optimizations(self):
        """
        Genera suggerimenti di ottimizzazione basati sull'analisi delle risorse e sui dati Lighthouse.
        Restituisce un elenco di opportunità di ottimizzazione.
        """
        optimizations = []

        # 1. Ottimizzazione delle immagini
        image_size_mb = self.resources.get('images', {}).get('size_bytes', 0) / (1024 * 1024)
        if image_size_mb > 1:
            potential_savings = round(image_size_mb * 0.6, 1)  # Stima: possibile risparmiare 60%
            optimizations.append({
                'title': 'Compressione Immagini',
                'description': f'Le immagini sono troppo pesanti. Puoi ridurre la dimensione complessiva di {potential_savings}MB (60%) utilizzando formati moderni come WebP e tecniche di compressione.',
                'priority': 'high' if image_size_mb > 2 else 'medium',
                'impact': round(potential_savings * 0.2, 2),  # CO2 risparmiata
                'resource_type': 'images',
                'economic_impact': round((potential_savings / (self.total_size / (1024 * 1024))) * 18.72, 2)  # Basato sui risparmi medi
            })

        # 2. Ottimizzazione JavaScript
        js_size_mb = self.resources.get('javascript', {}).get('size_bytes', 0) / (1024 * 1024)
        if js_size_mb > 0.5:
            potential_savings = round(js_size_mb * 0.3, 1)  # Stima: possibile risparmiare 30%
            optimizations.append({
                'title': 'Minificazione JavaScript',
                'description': f'I file JavaScript possono essere ridotti di {int(potential_savings * 1024)}KB (30%) attraverso la minificazione e l\'eliminazione del codice inutilizzato.',
                'priority': 'high' if js_size_mb > 1 else 'medium',
                'impact': round(potential_savings * 0.2, 2),  # CO2 risparmiata
                'resource_type': 'javascript',
                'economic_impact': round((potential_savings / (self.total_size / (1024 * 1024))) * 18.72, 2)
            })

        # 3. Ottimizzazione CSS
        css_size_mb = self.resources.get('css', {}).get('size_bytes', 0) / (1024 * 1024)
        if css_size_mb > 0.2:
            potential_savings = round(css_size_mb * 0.4, 1)  # Stima: possibile risparmiare 40%
            optimizations.append({
                'title': 'Minificazione CSS',
                'description': f'I file CSS possono essere ridotti di {int(potential_savings * 1024)}KB (40%) attraverso la minificazione e l\'eliminazione delle regole inutilizzate.',
                'priority': 'medium',
                'impact': round(potential_savings * 0.2, 2),  # CO2 risparmiata
                'resource_type': 'css',
                'economic_impact': round((potential_savings / (self.total_size / (1024 * 1024))) * 18.72, 2)
            })

        # 4. Suggerimento CDN (sempre consigliato)
        optimizations.append({
            'title': 'Implementazione CDN',
            'description': 'L\'implementazione di una Content Delivery Network (CDN) potrebbe ridurre le emissioni di CO₂ del 16% attraverso una distribuzione geografica ottimizzata.',
            'priority': 'low',
            'impact': round(self.co2_emissions * 0.16, 2),  # CO2 risparmiata: 16% del totale
            'resource_type': 'general',
            'economic_impact': round(18.72 * 0.16, 2)  # 16% dei risparmi annuali medi
        })

        # 5. Green hosting (sempre consigliato)
        optimizations.append({
            'title': 'Green Hosting',
            'description': 'Passare a un provider di hosting che utilizza energia rinnovabile potrebbe ridurre l\'impronta di carbonio del tuo sito fino al 40%.',
            'priority': 'low',
            'impact': round(self.co2_emissions * 0.4, 2),  # CO2 risparmiata: 40% del totale
            'resource_type': 'general',
            'economic_impact': round(18.72 * 0.10, 2)  # Impatto economico minore ma grande impatto ecologico
        })

        # Se utilizziamo Lighthouse Enhanced, aggiungi suggerimenti avanzati
        if self.using_lighthouse_enhanced:
            # Ottieni le metriche di performance
            performance_metrics = self.web_vitals.get('performance_metrics', {})
            optimization_scores = self.web_vitals.get('optimization_scores', {})

            # Verifica opportunità specifiche

            # 6. Formati di immagine di nuova generazione
            if optimization_scores.get('next_gen_images', 1) < 0.9:
                optimizations.append({
                    'title': 'Utilizza formati di immagine moderni',
                    'description': 'Converti le immagini JPEG/PNG in WebP o AVIF per ridurre significativamente le dimensioni dei file senza perdita di qualità.',
                    'priority': 'medium',
                    'impact': round(self.co2_emissions * 0.12, 2),
                    'resource_type': 'images',
                    'economic_impact': round(18.72 * 0.12, 2)
                })

            # 7. Rimozione JavaScript non utilizzato
            if optimization_scores.get('js_optimization', 1) < 0.8:
                optimizations.append({
                    'title': 'Rimuovi JavaScript non utilizzato',
                    'description': 'Una quantità significativa di JavaScript caricato non viene utilizzata. La rimozione del codice inutilizzato può ridurre i tempi di caricamento e di parsing.',
                    'priority': 'high',
                    'impact': round(self.co2_emissions * 0.15, 2),
                    'resource_type': 'javascript',
                    'economic_impact': round(18.72 * 0.15, 2)
                })

            # 8. Compressione del testo
            if optimization_scores.get('text_compression', 1) < 0.9:
                optimizations.append({
                    'title': 'Abilita la compressione del testo',
                    'description': 'Utilizza gzip o brotli per comprimere le risorse testuali (HTML, CSS, JavaScript) e ridurre le dimensioni di trasferimento fino al 70%.',
                    'priority': 'high',
                    'impact': round(self.co2_emissions * 0.1, 2),
                    'resource_type': 'general',
                    'economic_impact': round(18.72 * 0.1, 2)
                })

            # 9. Utilizzo di HTTP/2
            if optimization_scores.get('http2', 1) < 0.9:
                optimizations.append({
                    'title': 'Aggiorna a HTTP/2 o HTTP/3',
                    'description': 'L\'upgrade a HTTP/2 o HTTP/3 consente multiplex di richieste e risposte, riducendo la latenza e i tempi di caricamento complessivi.',
                    'priority': 'medium',
                    'impact': round(self.co2_emissions * 0.08, 2),
                    'resource_type': 'general',
                    'economic_impact': round(18.72 * 0.08, 2)
                })

            # 10. Migliora le policy di cache
            if optimization_scores.get('cache_policy', 1) < 0.8:
                optimizations.append({
                    'title': 'Ottimizza le policy di cache',
                    'description': 'Configura delle policy di cache efficaci con header Cache-Control appropriati per risorse statiche, riducendo le richieste di rete per i visitatori che ritornano.',
                    'priority': 'medium',
                    'impact': round(self.co2_emissions * 0.07, 2),
                    'resource_type': 'general',
                    'economic_impact': round(18.72 * 0.07, 2)
                })

            # 11. Riduci il lavoro del thread principale
            if performance_metrics.get('mainthread_work', 0) > 2000:
                optimizations.append({
                    'title': 'Ottimizza il carico di lavoro del thread principale',
                    'description': 'Il thread principale del browser è sovraccarico di lavoro. Suddividi operazioni JavaScript lunghe e sposta il lavoro non critico in Web Workers.',
                    'priority': 'high' if performance_metrics.get('mainthread_work', 0) > 4000 else 'medium',
                    'impact': round(self.co2_emissions * 0.11, 2),
                    'resource_type': 'javascript',
                    'economic_impact': round(18.72 * 0.11, 2)
                })

            # 12. Riduci risorse bloccanti
            if performance_metrics.get('render_blocking_resources', 0) > 2:
                optimizations.append({
                    'title': 'Elimina risorse bloccanti per il rendering',
                    'description': f'Ci sono {performance_metrics.get("render_blocking_resources", 0)} risorse che bloccano il rendering. Utilizza async/defer per script e preload per risorse critiche.',
                    'priority': 'high',
                    'impact': round(self.co2_emissions * 0.13, 2),
                    'resource_type': 'general',
                    'economic_impact': round(18.72 * 0.13, 2)
                })

            # 13. Riduci dimensione DOM
            if performance_metrics.get('dom_size', 0) > 1000:
                optimizations.append({
                    'title': 'Riduci la complessità del DOM',
                    'description': f'La pagina ha un DOM molto grande ({performance_metrics.get("dom_size", 0)} elementi). Un DOM più snello richiede meno memoria e è più efficiente energeticamente.',
                    'priority': 'medium',
                    'impact': round(self.co2_emissions * 0.05, 2),
                    'resource_type': 'html',
                    'economic_impact': round(18.72 * 0.05, 2)
                })

        # Aggiungi suggerimenti basati su Web Vitals se disponibili
        self._add_web_vitals_optimizations(optimizations)

        return optimizations

    def _add_web_vitals_optimizations(self, optimizations):
        """Aggiungi ottimizzazioni basate sulle misurazioni delle Web Vitals."""
        # Ottimizzazione LCP
        if self.web_vitals.get('lcp', 0) > 2500:  # LCP > 2.5s
            optimizations.append({
                'title': 'Migliorare LCP (Largest Contentful Paint)',
                'description': f'LCP è {self.web_vitals["lcp"]/1000:.2f}s, sopra la soglia raccomandata di 2.5s. Ottimizza il rendering dei contenuti principali precaricando le risorse critiche e posticipando quelle non essenziali.',
                'priority': 'high' if self.web_vitals['lcp'] > 4000 else 'medium',
                'impact': round(self.co2_emissions * 0.15, 2),  # 15% di risparmio di CO2
                'resource_type': 'performance',
                'economic_impact': round(18.72 * 0.15, 2)
            })

        # Ottimizzazione FID
        if self.web_vitals.get('fid', 0) > 100:  # FID > 100ms
            optimizations.append({
                'title': 'Migliorare FID (First Input Delay)',
                'description': f'FID è {self.web_vitals["fid"]:.2f}ms, sopra la soglia raccomandata di 100ms. Riduci il JavaScript bloccante e suddividi le attività lunghe per migliorare l\'interattività.',
                'priority': 'high' if self.web_vitals['fid'] > 300 else 'medium',
                'impact': round(self.co2_emissions * 0.1, 2),  # 10% di risparmio di CO2
                'resource_type': 'performance',
                'economic_impact': round(18.72 * 0.1, 2)
            })

        # Ottimizzazione CLS
        if self.web_vitals.get('cls', 0) > 0.1:  # CLS > 0.1
            optimizations.append({
                'title': 'Migliorare CLS (Cumulative Layout Shift)',
                'description': f'CLS è {self.web_vitals["cls"]:.3f}, sopra la soglia raccomandata di 0.1. Specifica le dimensioni per immagini e video, evita l\'inserimento di contenuti dinamici e utilizza schermate scheletro.',
                'priority': 'high' if self.web_vitals['cls'] > 0.25 else 'medium',
                'impact': round(self.co2_emissions * 0.08, 2),  # 8% di risparmio di CO2
                'resource_type': 'performance',
                'economic_impact': round(18.72 * 0.12, 2)
            })