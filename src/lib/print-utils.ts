// ─── Brand & Institution Constants ─────────────────────────

export const BRAND_COLOR = '#1B4F72';
export const BRAND_COLOR_LIGHT = '#1a6fb5';
export const BRAND_ORANGE = '#f59e0b';

export const DEFAULT_INSTITUTION = {
  schoolName: 'Institut Polytechnique Vase d\'Élites',
  shortName: 'IPVE',
  logoUrl: 'https://ik.imagekit.io/damts929ip/IPVE/Logo.png',
  address: 'Abidjan, Côte d\'Ivoire',
  city: 'ABIDJAN',
  phone: '',
  email: '',
  website: 'www.ipve.edu.ci',
  academicYear: '2025-2026',
};

// ─── Build a full HTML document for printing ───────────────

export function buildDocumentHTML(
  body: string,
  options?: { title?: string }
): string {
  const title = options?.title ?? 'Document IPVE';

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #1a1a1a;
      background: #fff;
      line-height: 1.5;
      -webkit-font-smoothing: antialiased;
    }

    .no-print {
      display: none !important;
    }

    .print-area {
      /* Ensures content is visible when printing */
    }

    @media print {
      @page {
        margin: 10mm;
        size: A4;
      }

      html, body {
        width: 210mm;
        margin: 0;
        padding: 0;
      }

      /* Hide everything except the print area */
      body > *:not(.print-area) {
        display: none !important;
      }

      .print-area {
        display: block !important;
      }

      /* Page break support */
      .page-break-before {
        page-break-before: always;
      }

      .page-break-after {
        page-break-after: always;
      }

      .no-page-break {
        page-break-inside: avoid;
      }

      /* Card sizing for print */
      .print-card-container {
        width: 85.6mm;
        height: 54mm;
        overflow: hidden;
        page-break-inside: avoid;
      }

      .print-card-full {
        width: 90mm;
        height: 140mm;
        overflow: hidden;
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="print-area">
    ${body}
  </div>
  <script>
    window.addEventListener('DOMContentLoaded', function () {
      window.print();
    });
  </script>
</body>
</html>`;
}

// ─── Open a print window with HTML content ─────────────────

export function openPrintWindow(html: string, title: string): void {
  const printWindow = window.open('', '_blank', 'width=800,height=1000,scrollbars=yes,resizable=yes');
  if (!printWindow) {
    // Fallback: try opening without features
    const fallback = window.open('');
    if (fallback) {
      fallback.document.write(html);
      fallback.document.close();
    } else {
      alert('Veuillez autoriser les popups pour imprimer ce document.');
    }
    return;
  }
  printWindow.document.write(html);
  printWindow.document.close();
}

// ─── Date formatting helpers ───────────────────────────────

export function formatDateFR(date: string | null | undefined): string {
  if (!date) return '—';
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return '—';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return '—';
  }
}

export function formatDateLongFR(date: string | null | undefined): string {
  if (!date) return '—';
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
}

export function todayFormatted(): string {
  const now = new Date();
  return now.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
