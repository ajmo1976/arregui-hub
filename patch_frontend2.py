import re

with open("src/modules/services/ServicesView.tsx", "r") as f:
    content = f.read()

# Add ivaRate to ServicesView HTML
html_row_target = """                                    <tr class="detail-total-row">
                                        <td colspan="4" class="text-right font-bold">Subtotal Servicio:</td>
                                        <td class="text-right font-bold">${formatPrice(detailTotal)}</td>
                                    </tr>"""
html_row_replace = """                                    <tr class="detail-total-row">
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

grand_total_target = """                            <div class="grand-total-box">
                                <span class="grand-total-label">Total a Facturar:</span>
                                <span class="grand-total-value">${formatPrice(grandTotal)}</span>
                            </div>"""
grand_total_replace = """                            <div class="grand-total-box">
                                <span class="grand-total-label">Total a Facturar:</span>
                                <span class="grand-total-value">${formatPrice(event.total_amount || grandTotal)}</span>
                            </div>"""
content = content.replace(grand_total_target, grand_total_replace)

with open("src/modules/services/ServicesView.tsx", "w") as f:
    f.write(content)
