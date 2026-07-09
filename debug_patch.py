import re

with open("src/modules/services/ServiceDetailView.tsx", "r") as f:
    content = f.read()

# Replace condition in handlePrintAll
content = content.replace('${event.iva_percentage > 0 ? `', '${event.iva_percentage !== undefined ? `')
content = content.replace('${(event.iva_percentage || 0) > 0 && (', '{event.iva_percentage !== undefined && (')

with open("src/modules/services/ServiceDetailView.tsx", "w") as f:
    f.write(content)

with open("src/modules/services/ServicesView.tsx", "r") as f:
    content2 = f.read()

content2 = content2.replace('${event.iva_percentage > 0 ? `', '${event.iva_percentage !== undefined ? `')

with open("src/modules/services/ServicesView.tsx", "w") as f:
    f.write(content2)

print("Debug patch applied")
