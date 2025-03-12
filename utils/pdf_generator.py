"""
Servizio per la generazione di report PDF dall'analisi di sostenibilità.
"""

import os
from datetime import datetime
from flask import render_template, url_for
from weasyprint import HTML, CSS
from jinja2 import Environment, FileSystemLoader
from utils.formatters import format_file_size, format_currency, format_percent, format_co2

class PDFReportGenerator:
    """
    Classe per generare report PDF dalle analisi di sostenibilità.
    Utilizza WeasyPrint per convertire HTML in PDF.
    """

    def __init__(self, templates_dir='templates/pdf'):
        """
        Inizializza il generatore di report.

        Args:
            templates_dir: Directory contenente i template HTML per i PDF
        """
        self.templates_dir = templates_dir
        self.env = Environment(loader=FileSystemLoader(templates_dir))
        self.env.filters['format_file_size'] = format_file_size
        self.env.filters['format_currency'] = format_currency
        self.env.filters['format_percent'] = format_percent
        self.env.filters['format_co2'] = format_co2
        self.env.filters['datetime'] = lambda d: d.strftime('%d/%m/%Y %H:%M')

    def generate_report(self, analysis_data, output_path=None):
        """
        Genera un report PDF basato sui dati dell'analisi.

        Args:
            analysis_data: Dati dell'analisi di sostenibilità
            output_path: Percorso di output per il file PDF (opzionale)

        Returns:
            bytes: Contenuto del PDF se output_path è None, altrimenti None
        """
        # Aggiungi data e ora all'analisi
        analysis_data['report_date'] = datetime.now()

        # Calcola metriche addizionali per il report se necessario
        self._enhance_report_data(analysis_data)

        # Renderizza il template HTML
        template = self.env.get_template('report_template.html')
        html_content = template.render(data=analysis_data)

        # Configura i CSS per il report
        css_files = [
            os.path.join(self.templates_dir, 'css/report.css'),
            os.path.join(self.templates_dir, 'css/charts.css')
        ]

        # Crea il PDF
        html = HTML(string=html_content)
        css = [CSS(filename=css_file) for css_file in css_files if os.path.exists(css_file)]

        if output_path:
            # Assicurati che la directory esista
            os.makedirs(os.path.dirname(output_path), exist_ok=True)
            html.write_pdf(output_path, stylesheets=css)
            return output_path
        else:
            # Restituisci il PDF come bytes
            return html.write_pdf(stylesheets=css)

    def _enhance_report_data(self, data):
        """
        Migliora i dati dell'analisi con informazioni aggiuntive utili per il report.

        Args:
            data: Dati di analisi da migliorare
        """
        # Calcola il totale delle risorse
        total_resources = 0
        for resource_type, resource_data in data.get('resources', {}).items():
            total_resources += resource_data.get('count', 0)

        data['total_resources_count'] = total_resources

        # Aggiungi consigli principali in base alla priorità
        optimizations = data.get('optimizations', [])
        data['top_optimizations'] = sorted(
            optimizations,
            key=lambda x: 0 if x.get('priority') == 'high' else 1 if x.get('priority') == 'medium' else 2
        )[:3]

        # Calcola risparmi totali annuali
        economic_benefits = data.get('metrics', {}).get('economic_benefits', {})
        if economic_benefits:
            data['annual_savings'] = economic_benefits.get('potential_annual_savings', 0)
            data['monthly_visits'] = economic_benefits.get('estimated_monthly_visits', 0)
            data['annual_visits'] = data['monthly_visits'] * 12

            # Calcola risparmio CO2 annuale
            data['annual_co2_savings'] = 0
            for opt in optimizations:
                data['annual_co2_savings'] += opt.get('impact', 0)
            data['annual_co2_savings'] = round(data['annual_co2_savings'] * 365, 2)


# Funzione di aiuto per generare un report utilizzando Flask
def generate_report_from_request(analysis_data, filename=None):
    """
    Genera un report PDF partendo dai dati di analisi di una richiesta.

    Args:
        analysis_data: Dati dell'analisi di sostenibilità
        filename: Nome del file PDF da generare (opzionale)

    Returns:
        bytes: Contenuto del PDF o percorso del file
    """
    generator = PDFReportGenerator()

    if filename:
        # Utilizza una cartella temporanea o configurata per i report
        reports_dir = os.environ.get('REPORTS_DIR', 'static/reports')
        output_path = os.path.join(reports_dir, filename)
        return generator.generate_report(analysis_data, output_path)
    else:
        return generator.generate_report(analysis_data)