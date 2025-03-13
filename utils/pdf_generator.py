"""
Placeholder for PDF generation service.
This module is a stub that replaces the WeasyPrint-based PDF generator.
"""

import os
from datetime import datetime

# Define the function signature but return a placeholder message
def generate_report_from_request(analysis_data, filename=None):
    """
    Placeholder for PDF report generation.

    Args:
        analysis_data: Data from the sustainability analysis
        filename: Optional filename for the PDF report

    Returns:
        str: A message indicating that PDF generation is disabled
    """
    # Create a simple placeholder file to satisfy the API contract
    if filename:
        reports_dir = os.environ.get('REPORTS_DIR', 'static/reports')
        os.makedirs(reports_dir, exist_ok=True)
        output_path = os.path.join(reports_dir, filename.replace('.pdf', '.txt'))

        with open(output_path, 'w') as f:
            f.write(f"PDF Report for {analysis_data.get('domain', 'unknown')}\n")
            f.write(f"Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
            f.write("PDF generation is currently disabled.\n")
            f.write("This feature requires additional system libraries (libgobject-2.0-0).\n")
            f.write("Please check the documentation for installation instructions.\n")

        return output_path

    return "PDF generation is currently disabled"

class PDFReportGenerator:
    """
    Placeholder class for the PDF report generator.
    """

    def __init__(self, templates_dir='templates/pdf'):
        """Initialize the placeholder generator."""
        self.templates_dir = templates_dir

    def generate_report(self, analysis_data, output_path=None):
        """
        Placeholder for report generation.

        Args:
            analysis_data: Analysis data
            output_path: Optional output path

        Returns:
            str: A message or path
        """
        return generate_report_from_request(analysis_data,
                                            "report.txt" if output_path is None else output_path)