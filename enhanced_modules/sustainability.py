"""
Sustainability module migliorato per calcolare metriche di impatto ambientale
utilizzando i dati avanzati di Lighthouse.
"""

import logging
import json
import traceback
from config import Config

# Configura logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

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
        logger.info(f"Inizializzazione analizzatore sostenibilità avanzato: using_lighthouse_enhanced={self.using_lighthouse_enhanced}")

        if self.using_lighthouse_enhanced:
            logger.info(f"Web vitals analyzer type: {web_vitals_data.get('analyzer_type')}")
            if 'category_scores' in web_vitals_data:
                logger.info(f"Category scores disponibili: {list(web_vitals_data['category_scores'].keys())}")
            else:
                logger.info("Category scores non disponibili nei dati")

    def calculate_metrics(self):
        """
        Calcola metriche di sostenibilità e punteggi usando tutti i dati disponibili.
        Restituisce un dizionario di metriche calcolate.
        """
        # Log iniziale
        logger.info("Inizio calcolo metriche di sostenibilità avanzate")

        # Verifica disponibilità dati web vitals
        using_lighthouse = self.using_lighthouse_enhanced
        logger.info(f"Utilizzando analizzatore Lighthouse Enhanced: {using_lighthouse}")

        if using_lighthouse:
            logger.info(f"Tipo analizzatore: {self.web_vitals.get('analyzer_type', 'unknown')}")

        # Calcola le emissioni di CO2 in base alla dimensione totale del trasferimento
        total_mb = self.total_size / (1024 * 1024)
        self.co2_emissions = round(total_mb * Config.CO2_PER_MB, 2)
        logger.info(f"CO2 calcolato: {self.co2_emissions}g (da {total_mb} MB)")

        # Calcola il punteggio di sostenibilità
        self._calculate_enhanced_sustainability_score()
        logger.info(f"Punteggio sostenibilità: {self.sustainability_score}/100")

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
            logger.info(f"Energy metrics disponibili: {bool(energy_metrics)}")

            # Calcola un punteggio di efficienza energetica
            energy_efficiency_score = 0

            # Ottieni punteggi di ottimizzazione che influenzano l'efficienza
            optimization_scores = self.web_vitals.get('optimization_scores', {})
            logger.info(f"Optimization scores disponibili: {bool(optimization_scores)}")
            if optimization_scores:
                logger.info(f"Optimization scores: {optimization_scores}")
                # Pondera i fattori che maggiormente influenzano l'efficienza energetica
                energy_efficiency_score = (
                                                  (optimization_scores.get('compress_images', 0.5) * 0.2) +
                                                  (optimization_scores.get('next_gen_images', 0.5) * 0.2) +
                                                  (optimization_scores.get('text_compression', 0.5) * 0.1) +
                                                  (optimization_scores.get('js_optimization', 0.5) * 0.3) +
                                                  (optimization_scores.get('cache_policy', 0.5) * 0.1) +
                                                  (optimization_scores.get('http2', 0.5) * 0.1)
                                          ) * 100
                logger.info(f"Energy efficiency score calcolato: {energy_efficiency_score}")

            # Calcola una stima di kWh per visita
            estimated_kwh = total_mb * Config.ENERGY_CONSUMPTION_PER_MB
            logger.info(f"Consumo energetico stimato per visita: {estimated_kwh} kWh")

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
            logger.info(f"Accessibility score: {accessibility_score}")
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
            logger.info(f"Carbon footprint annuale stimato: {metrics['yearly_carbon_footprint']['kg_co2']} kg CO2")

        # Logga le metriche finali
        logger.info(f"Metriche di sostenibilità generate: {json.dumps({k: v for k, v in metrics.items() if not isinstance(v, dict)}, indent=2)}")

        # Logga anche la presenza di metriche avanzate
        if 'energy_efficiency' in metrics:
            logger.info("Metriche avanzate generate: energy_efficiency")
        if 'accessibility' in metrics:
            logger.info("Metriche avanzate generate: accessibility")
        if 'yearly_carbon_footprint' in metrics:
            logger.info("Metriche avanzate generate: yearly_carbon_footprint")

        return metrics

    def _calculate_enhanced_sustainability_score(self):
        """Calcola il punteggio di sostenibilità complessivo (0-100) utilizzando tutte le metriche disponibili."""
        # Inizia con un punteggio perfetto e sottrai punti in base ai problemi
        score = 100
        logger.info("Calcolo punteggio sostenibilità migliorato")

        # 1. Fattori di dimensione (15% del punteggio)
        total_mb = self.total_size / (1024 * 1024)
        if total_mb > 5:  # Più di 5MB
            score -= 15
            logger.info("Penalità dimensione +5MB: -15 punti")
        elif total_mb > 3:  # Tra 3-5MB
            score -= 9
            logger.info("Penalità dimensione 3-5MB: -9 punti")
        elif total_mb > 1:  # Tra 1-3MB
            score -= 4.5
            logger.info("Penalità dimensione 1-3MB: -4.5 punti")
        else:
            logger.info("Nessuna penalità per dimensione (≤1MB)")

        # 2. Fattori di tempo di caricamento (15% del punteggio)
        if self.load_time > 5:  # Più di 5 secondi
            score -= 15
            logger.info("Penalità tempo di caricamento +5s: -15 punti")
        elif self.load_time > 3:  # Tra 3-5 secondi
            score -= 9
            logger.info("Penalità tempo di caricamento 3-5s: -9 punti")
        elif self.load_time > 1:  # Tra 1-3 secondi
            score -= 4.5
            logger.info("Penalità tempo di caricamento 1-3s: -4.5 punti")
        else:
            logger.info("Nessuna penalità per tempo di caricamento (≤1s)")

        # 3. Conteggio delle risorse (10% del punteggio)
        resource_counts = {k: v.get('count', 0) for k, v in self.resources.items()}
        total_resources = sum(resource_counts.values())
        logger.info(f"Risorse totali: {total_resources} (ripartizione: {resource_counts})")

        if total_resources > 80:
            score -= 10
            logger.info("Penalità numero risorse +80: -10 punti")
        elif total_resources > 50:
            score -= 6
            logger.info("Penalità numero risorse 50-80: -6 punti")
        elif total_resources > 30:
            score -= 3
            logger.info("Penalità numero risorse 30-50: -3 punti")
        else:
            logger.info("Nessuna penalità per numero risorse (≤30)")

        # 4. Se utilizziamo Lighthouse Enhanced, incorpora metriche avanzate (60% restante)
        if self.using_lighthouse_enhanced:
            logger.info("Utilizzo metriche Lighthouse avanzate per il punteggio")

            # A. Punteggio Core Web Vitals (20% del punteggio)
            web_vitals_score = self.web_vitals.get('scores', {}).get('overall', 0)
            if web_vitals_score > 0:
                web_vitals_contribution = web_vitals_score * 0.2
                score -= 20  # Rimuovi il 20% massimo...
                score += web_vitals_contribution  # ...e aggiungi il contributo effettivo
                logger.info(f"Contributo Web Vitals: +{web_vitals_contribution:.2f} punti (score={web_vitals_score})")

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
                logger.info(f"Contributo ottimizzazione: +{optimization_contribution:.2f} punti (avg={avg_optimization:.2f})")

            # C. Peso totale dei byte (10% del punteggio)
            total_byte_weight = self.web_vitals.get('total_byte_weight', 0) / (1024 * 1024)
            if total_byte_weight > 0:
                logger.info(f"Peso totale byte da Web Vitals: {total_byte_weight:.2f} MB")
                if total_byte_weight > 5:
                    score -= 10
                    logger.info("Penalità peso totale byte +5MB: -10 punti")
                elif total_byte_weight > 3:
                    score -= 6
                    logger.info("Penalità peso totale byte 3-5MB: -6 punti")
                elif total_byte_weight > 1:
                    score -= 3
                    logger.info("Penalità peso totale byte 1-3MB: -3 punti")
                else:
                    logger.info("Nessuna penalità per peso totale byte (≤1MB)")

            # D. Accessibilità (5% del punteggio) - l'accessibilità contribuisce anche alla sostenibilità
            accessibility_score = self.web_vitals.get('accessibility_score', 0)
            if accessibility_score > 0:
                accessibility_contribution = accessibility_score * 0.05 / 100
                score -= 5  # Rimuovi il 5% massimo...
                score += accessibility_contribution  # ...e aggiungi il contributo effettivo
                logger.info(f"Contributo accessibilità: +{accessibility_contribution:.2f} punti (score={accessibility_score})")

            # E. Best Practices (5% del punteggio)
            best_practices_score = self.web_vitals.get('best_practices_score', 0)
            if best_practices_score > 0:
                best_practices_contribution = best_practices_score * 0.05 / 100
                score -= 5  # Rimuovi il 5% massimo...
                score += best_practices_contribution  # ...e aggiungi il contributo effettivo
                logger.info(f"Contributo best practices: +{best_practices_contribution:.2f} punti (score={best_practices_score})")

            # F. Parametri JS (5% del punteggio)
            performance_metrics = self.web_vitals.get('performance_metrics', {})
            bootup_time = performance_metrics.get('bootup_time', 0)
            if bootup_time > 0:
                logger.info(f"Bootup time JS: {bootup_time:.2f}ms")
                if bootup_time > 1000:
                    score -= 5
                    logger.info("Penalità bootup time +1000ms: -5 punti")
                elif bootup_time > 500:
                    score -= 3
                    logger.info("Penalità bootup time 500-1000ms: -3 punti")
                elif bootup_time > 250:
                    score -= 1.5
                    logger.info("Penalità bootup time 250-500ms: -1.5 punti")
                else:
                    logger.info("Nessuna penalità per bootup time (≤250ms)")

        else:
            # Se non utilizziamo Lighthouse Enhanced, usa l'approccio standard
            logger.info("Utilizzo approccio standard per il punteggio (senza metriche avanzate)")
            web_vitals_score = self.web_vitals.get('scores', {}).get('overall', 0)
            if web_vitals_score > 0:
                # Applica Web Vitals come 60% del punteggio complessivo
                old_score = score
                score = (score * 0.4) + (web_vitals_score * 0.6)
                logger.info(f"Punteggio aggiustato con Web Vitals: da {old_score:.2f} a {score:.2f}")

        # Assicurati che il punteggio sia tra 0-100
        self.sustainability_score = max(0, min(100, int(score)))
        logger.info(f"Punteggio sostenibilità finale: {self.sustainability_score}")

    def generate_optimizations(self):
        """
        Genera suggerimenti di ottimizzazione basati sull'analisi delle risorse e sui dati Lighthouse.
        Restituisce un elenco di opportunità di ottimizzazione.
        """
        logger.info("Generazione suggerimenti di ottimizzazione")
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
            logger.info(f"Aggiunto suggerimento: Compressione Immagini ({potential_savings}MB potenziali)")

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
            logger.info(f"Aggiunto suggerimento: Minificazione JavaScript ({potential_savings}MB potenziali)")

        # Continua con altri suggerimenti...

        # Se utilizziamo Lighthouse Enhanced, aggiungi suggerimenti avanzati
        if self.using_lighthouse_enhanced:
            logger.info("Aggiunta suggerimenti avanzati basati su Lighthouse")
            # Ottieni le metriche di performance
            performance_metrics = self.web_vitals.get('performance_metrics', {})
            optimization_scores = self.web_vitals.get('optimization_scores', {})

            if performance_metrics:
                logger.info(f"Performance metrics disponibili: {list(performance_metrics.keys())}")

            if optimization_scores:
                logger.info(f"Optimization scores disponibili: {list(optimization_scores.keys())}")

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
                logger.info("Aggiunto suggerimento: Formati immagine moderni")

            # Aggiungi altri suggerimenti basati sui punteggi di ottimizzazione...

        # Aggiungi suggerimenti basati su Web Vitals se disponibili
        self._add_web_vitals_optimizations(optimizations)

        logger.info(f"Generati {len(optimizations)} suggerimenti di ottimizzazione")
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
            logger.info(f"Aggiunto suggerimento: Migliorare LCP ({self.web_vitals['lcp']/1000:.2f}s)")

        # Ottimizzazione interattività
        if self.web_vitals.get('fid', 0) > 100:  # FID > 100ms
            optimizations.append({
                'title': 'Migliorare l\'interattività della pagina',
                'description': f'La reattività misurata è {self.web_vitals["fid"]:.2f}ms, sopra la soglia raccomandata di 100ms. Riduci il JavaScript bloccante e suddividi le attività lunghe per migliorare le interazioni.',
                'priority': 'high' if self.web_vitals['fid'] > 300 else 'medium',
                'impact': round(self.co2_emissions * 0.1, 2),  # 10% di risparmio di CO2
                'resource_type': 'performance',
                'economic_impact': round(18.72 * 0.1, 2)
            })
            logger.info(f"Aggiunto suggerimento: Migliorare interattività ({self.web_vitals['fid']:.2f}ms)")

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
            logger.info(f"Aggiunto suggerimento: Migliorare CLS ({self.web_vitals['cls']:.3f})")
