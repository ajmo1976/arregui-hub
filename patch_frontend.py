import re

with open("src/modules/services/ServiceDetailView.tsx", "r") as f:
    content = f.read()

# Add ivaRate to handlePrintAll HTML
html_row_target = """                            <tr class="detail-total-row">
                                <td colspan="4" class="text-right font-bold">Subtotal Servicio:</td>
                                <td class="text-right font-bold">${formatPrice(detailTotal)}</td>
                            </tr>"""
html_row_replace = """                            <tr class="detail-total-row">
                                <td colspan="4" class="text-right font-bold">Subtotal Servicio:</td>
                                <td class="text-right font-bold">${formatPrice(detailTotal)}</td>
                            </tr>
                            ${event.iva_percentage > 0 ? `
                            <tr>
                                <td colspan="4" class="text-right font-bold">IVA (${event.iva_percentage}%):</td>
                                <td class="text-right font-bold">${formatPrice(detailTotal * (event.iva_percentage / 100))}</td>
                            </tr>
                            ` : ''}"""
content = content.replace(html_row_target, html_row_replace)

# Update grand-total HTML
grand_total_target = """                    <div class="grand-total-box">
                        <span class="grand-total-label">${event.status === 'Facturado' ? 'Total Facturado' : (event.status === 'Cobrado' ? 'Total Cobrado' : 'Total a Facturar')} Servicio #${event.id}:</span>
                        <span class="grand-total-value">${formatPrice(grandTotal)}</span>
                    </div>"""
grand_total_replace = """                    <div class="grand-total-box">
                        <span class="grand-total-label">${event.status === 'Facturado' ? 'Total Facturado' : (event.status === 'Cobrado' ? 'Total Cobrado' : 'Total a Facturar')} Servicio #${event.id}:</span>
                        <span class="grand-total-value">${formatPrice(event.total_amount || grandTotal)}</span>
                    </div>"""
content = content.replace(grand_total_target, grand_total_replace)

# Update handleExportToExcel CSV logic
csv_target = """        csvContent += `\\r\\n;;;;;;;;Total General;${grandTotal};;\\r\\n`;"""
csv_replace = """        const ivaPercentage = event.iva_percentage || 0;
        const ivaAmount = grandTotal * (ivaPercentage / 100);
        const totalFacturar = event.total_amount || grandTotal;

        if (ivaPercentage > 0) {
            csvContent += `\\r\\n;;;;;;;;Subtotal Servicio;${grandTotal};;\\r\\n`;
            csvContent += `;;;;;;;;IVA (${ivaPercentage}%);${ivaAmount};;\\r\\n`;
            csvContent += `;;;;;;;;Total General;${totalFacturar};;\\r\\n`;
        } else {
            csvContent += `\\r\\n;;;;;;;;Total General;${grandTotal};;\\r\\n`;
        }"""
content = content.replace(csv_target, csv_replace)

with open("src/modules/services/ServiceDetailView.tsx", "w") as f:
    f.write(content)
