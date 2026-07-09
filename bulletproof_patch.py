import re

with open("src/modules/services/ServiceDetailView.tsx", "r") as f:
    content = f.read()

# Fix the print template: use iva_percentage ?? 0
content = re.sub(
    r'\$\{event\.iva_percentage !== undefined \? `\n\s*<tr>\n\s*<td colspan="4" class="text-right font-bold">IVA \(\$\{event\.iva_percentage\}%\):</td>\n\s*<td class="text-right font-bold">\$\{formatPrice\(detailTotal \* \(event\.iva_percentage / 100\)\)\}</td>\n\s*</tr>\n\s*` : ''\}',
    r'''${true ? `
                            <tr>
                                <td colspan="4" class="text-right font-bold">IVA (${event.iva_percentage ?? 0}%):</td>
                                <td class="text-right font-bold">${formatPrice(detailTotal * ((event.iva_percentage ?? 0) / 100))}</td>
                            </tr>
                            ` : ''}''',
    content
)

# Fix the UI component
content = re.sub(
    r'\{event\.iva_percentage > 0 && \(\n\s*<div className="flex justify-between items-center text-xs text-gray-500 font-bold uppercase">\n\s*<span>IVA \(\{event\.iva_percentage\}%\):</span>\n\s*<span>\{formatPrice\(\(detail\.estimated_amount \|\| 0\) \* \(event\.iva_percentage / 100\)\)\}</span>\n\s*</div>\n\s*\)\}',
    r'''{true && (
                                                            <div className="flex justify-between items-center text-xs text-gray-500 font-bold uppercase">
                                                                <span>IVA ({event.iva_percentage ?? 0}%):</span>
                                                                <span>{formatPrice((detail.estimated_amount || 0) * ((event.iva_percentage ?? 0) / 100))}</span>
                                                            </div>
                                                        )}''',
    content
)

with open("src/modules/services/ServiceDetailView.tsx", "w") as f:
    f.write(content)

