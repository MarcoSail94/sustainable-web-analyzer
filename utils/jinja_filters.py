"""
Filtri Jinja personalizzati per i template.
"""

import datetime

def register_filters(app):
    """Registra i filtri Jinja personalizzati nell'app Flask."""
    app.jinja_env.filters['format_date'] = format_date
    app.jinja_env.filters['format_currency'] = format_currency
    app.jinja_env.filters['format_percent'] = format_percent
    # Aggiungi l'estensione per avere {% now %} nei template
    app.jinja_env.globals.update(now=datetime_now)

def format_date(value, format='%d/%m/%Y'):
    """Formatta una data in una stringa."""
    if isinstance(value, datetime.datetime):
        return value.strftime(format)
    return value

def format_currency(value, currency='€', decimals=2):
    """Formatta un valore come valuta."""
    try:
        return f"{currency}{float(value):.{decimals}f}"
    except (ValueError, TypeError):
        return value

def format_percent(value, decimals=0):
    """Formatta un valore come percentuale."""
    try:
        # Gestisce sia range 0-100 che 0-1
        if float(value) <= 1 and decimals == 0:
            value = float(value) * 100
        return f"{float(value):.{decimals}f}%"
    except (ValueError, TypeError):
        return value

def datetime_now(format='%Y'):
    """Restituisce la data/ora corrente formattata."""
    return datetime.datetime.now().strftime(format)