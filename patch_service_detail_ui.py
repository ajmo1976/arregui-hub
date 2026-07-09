import re

with open("src/modules/services/ServiceDetailView.tsx", "r") as f:
    content = f.read()

target = """                                                    )}
                                                </div>
                                            </div>

                                            {/* Requirements & Obs */}"""

replacement = """                                                    )}
                                                </div>
                                                
                                                {/* Resumen de Costos */}
                                                {canShowPrices && (
                                                    <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-750 flex flex-col gap-2">
                                                        <div className="flex justify-between items-center text-xs text-gray-500 font-bold uppercase">
                                                            <span>Subtotal:</span>
                                                            <span>{formatPrice(detail.estimated_amount || 0)}</span>
                                                        </div>
                                                        {event.iva_percentage > 0 && (
                                                            <div className="flex justify-between items-center text-xs text-gray-500 font-bold uppercase">
                                                                <span>IVA ({event.iva_percentage}%):</span>
                                                                <span>{formatPrice((detail.estimated_amount || 0) * (event.iva_percentage / 100))}</span>
                                                            </div>
                                                        )}
                                                        <div className="flex justify-between items-center text-sm text-primary font-black uppercase mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                                                            <span>Total:</span>
                                                            <span>{formatPrice((detail.estimated_amount || 0) * (1 + (event.iva_percentage || 0) / 100))}</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Requirements & Obs */}"""

new_content = content.replace(target, replacement)

with open("src/modules/services/ServiceDetailView.tsx", "w") as f:
    f.write(new_content)
print("Patched UI in ServiceDetailView.tsx")
