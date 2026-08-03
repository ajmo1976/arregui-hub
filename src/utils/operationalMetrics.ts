export const parseObservations = (obs: string) => {
    if (!obs) return { t1: null, t2: null, t3: null, t4: null, manual: null, cleanObs: '' };

    const match = obs.match(/\[DESGLOSE_ALMUERZOS:\s*T1=(\d+|),\s*T2=(\d+|),\s*T3=(\d+|),\s*T4=(\d+|),\s*M=(\d+|)\]/);
    if (match) {
        return {
            t1: match[1] === '' ? null : parseInt(match[1]),
            t2: match[2] === '' ? null : parseInt(match[2]),
            t3: match[3] === '' ? null : parseInt(match[3]),
            t4: match[4] === '' ? null : parseInt(match[4]),
            manual: match[5] === '' ? null : parseInt(match[5]),
            cleanObs: obs.replace(/\[DESGLOSE_ALMUERZOS:\s*T1=(\d+|),\s*T2=(\d+|),\s*T3=(\d+|),\s*T4=(\d+|),\s*M=(\d+|)\]\s*/, '')
        };
    }
    const legacyMatch = obs.match(/\[DESGLOSE_ALMUERZOS:\s*T1=(\d+|),\s*T2=(\d+|),\s*M=(\d+|)\]/);
    if (legacyMatch) {
        return {
            t1: legacyMatch[1] === '' ? null : parseInt(legacyMatch[1]),
            t2: legacyMatch[2] === '' ? null : parseInt(legacyMatch[2]),
            t3: null,
            t4: null,
            manual: legacyMatch[3] === '' ? null : parseInt(legacyMatch[3]),
            cleanObs: obs.replace(/\[DESGLOSE_ALMUERZOS:\s*T1=(\d+|),\s*T2=(\d+|),\s*M=(\d+|)\]\s*/, '')
        };
    }
    return { t1: null, t2: null, t3: null, t4: null, manual: null, cleanObs: obs };
};

export const getPriceForDate = (prices: any[], dateStr: string, concept: string): number => {
    const targetDate = dateStr.substring(0, 10);
    
    let sameTypePrices = prices.filter(p => p.type.toLowerCase() === concept.toLowerCase());
    
    if (sameTypePrices.length === 0 && concept.toLowerCase() === 'almuerzo_comedor') {
        sameTypePrices = prices.filter(p => p.type.toUpperCase() === 'ESTANDAR' || p.type === 'Estándar');
    }
    
    if (sameTypePrices.length === 0 && concept.toLowerCase() === 'sm_sobre_cenas') {
        sameTypePrices = prices.filter(p => p.type.toUpperCase() === 'SOBRE_CENA' || p.type === 'Sobre Cena');
    }
    
    if (sameTypePrices.length === 0) {
        sameTypePrices = prices.filter(p => p.type.toUpperCase() === 'ESTANDAR' || p.type === 'Estándar');
    }
    
    if (sameTypePrices.length === 0) return 0;
    
    const pastPrices = sameTypePrices
        .filter(p => p.effective_date <= targetDate)
        .sort((a, b) => b.effective_date.localeCompare(a.effective_date));
    if (pastPrices.length > 0) return pastPrices[0].price;
    const earliestPrice = [...sameTypePrices].sort((a, b) => a.effective_date.localeCompare(b.effective_date))[0];
    return earliestPrice?.price || 0;
};

export const getPlanningDetails = (planningEvents: any[]) => {
    const details: any[] = [];
    planningEvents.forEach(ev => {
        (ev.details || []).forEach((d: any) => {
            let plc = 0, sm = 0, cnPlanta = 0, cenas = 0, sc = 0, conc = 0, cnExt = 0, csExt = 0;
            let sistemasCep = 0, seguridadPlc = 0, seguridadRuices = 0, seguridadCentralCep = 0;
            let especialesData = null;
            let totalEspeciales = 0;

            const isMetropolitano = ev.cost_center === 'Metropolitano' || ev.cost_center === 'Territorio Metropolitano';
            const isCep = ev.cost_center === 'CEP';
            const isEspecial = ev.cost_center === 'Servicios Especiales' || ev.cost_center === 'Quintas' || (ev.title && (ev.title.includes('Quintas') || ev.title.includes('Especiales')));

            let sd = d.structured_data;
            if (typeof sd === 'string') {
                try { sd = JSON.parse(sd); } catch (e) { sd = {}; }
            }

            if (sd && Object.keys(sd).length > 0) {
                if (d.service_category_id === 4 || isMetropolitano) {
                    plc = parseInt(sd.plc) || 0;
                    sm = parseInt(sd.sm) || 0;
                    cnPlanta = parseInt(sd.cnPlanta || sd.colNortePlanta) || 0;
                    cenas = parseInt(sd.cenas) || 0;
                    sc = parseInt(sd.sc || sd.sobreCenas) || 0;
                    conc = parseInt(sd.conc || sd.concentrados) || 0;
                    cnExt = parseInt(sd.cnExt || sd.colNorteExt) || 0;
                    csExt = parseInt(sd.csExt || sd.colSurExt) || 0;
                } else if (d.service_category_id === 3 || isCep) {
                    sistemasCep = parseInt(sd.sistemasCep) || 0;
                    seguridadPlc = parseInt(sd.segPlc) || 0;
                    seguridadRuices = parseInt(sd.segRuices) || 0;
                    seguridadCentralCep = parseInt(sd.segCentral) || 0;
                } else if (d.service_category_id === 2 || isEspecial) {
                    especialesData = sd;
                    totalEspeciales = (parseInt(sd.choferes?.cenas)||0) + (parseInt(sd.quintas?.cenas)||0) + (parseInt(sd.pilotos?.almuerzos)||0);
                }
            } else {
                const obs = d.observations || '';
                if (isCep) {
                    const matchCep = obs.match(/\[DESGLOSE_PLANIFICACION_CEP:\s*SISTEMAS_CEP=(\d+),\s*SEG_PLC=(\d+),\s*SEG_RUICES=(\d+),\s*SEG_CENTRAL=(\d+)\]/);
                    if (matchCep) {
                        sistemasCep = parseInt(matchCep[1]);
                        seguridadPlc = parseInt(matchCep[2]);
                        seguridadRuices = parseInt(matchCep[3]);
                        seguridadCentralCep = parseInt(matchCep[4]);
                    } else {
                        const f1 = obs.match(/SISTEMAS_CEP=(\d+)/);
                        const f2 = obs.match(/SEG_PLC=(\d+)/);
                        const f3 = obs.match(/SEG_RUICES=(\d+)/);
                        const f4 = obs.match(/SEG_CENTRAL=(\d+)/);
                        sistemasCep = f1 ? parseInt(f1[1]) : 0;
                        seguridadPlc = f2 ? parseInt(f2[1]) : 0;
                        seguridadRuices = f3 ? parseInt(f3[1]) : 0;
                        seguridadCentralCep = f4 ? parseInt(f4[1]) : 0;
                    }
                } else if (isMetropolitano) {
                    const match = obs.match(/\[DESGLOSE_PLANIFICACION:\s*PLC=(\d+),\s*SM=(\d+),\s*CN_PLANTA=(\d+),\s*CENAS=(\d+),\s*SC=(\d+),\s*CONC=(\d+),\s*CN_EXT=(\d+),\s*CS_EXT=(\d+)\]/);
                    if (match) {
                        plc = parseInt(match[1]);
                        sm = parseInt(match[2]);
                        cnPlanta = parseInt(match[3]);
                        cenas = parseInt(match[4]);
                        sc = parseInt(match[5]);
                        conc = parseInt(match[6]);
                        cnExt = parseInt(match[7]);
                        csExt = parseInt(match[8]);
                    } else {
                        const fallbackPlc = obs.match(/PLC=(\d+)/);
                        const fallbackSm = obs.match(/SM=(\d+)/);
                        const fallbackCnPlanta = obs.match(/CN_PLANTA=(\d+)/);
                        const fallbackCenas = obs.match(/CENAS=(\d+)/);
                        const fallbackSc = obs.match(/SC=(\d+)/);
                        const fallbackConc = obs.match(/CONC=(\d+)/);
                        const fallbackCnExt = obs.match(/CN_EXT=(\d+)/);
                        const fallbackCsExt = obs.match(/CS_EXT=(\d+)/);
                        
                        plc = fallbackPlc ? parseInt(fallbackPlc[1]) : 0;
                        sm = fallbackSm ? parseInt(fallbackSm[1]) : 0;
                        cnPlanta = fallbackCnPlanta ? parseInt(fallbackCnPlanta[1]) : 0;
                        cenas = fallbackCenas ? parseInt(fallbackCenas[1]) : 0;
                        sc = fallbackSc ? parseInt(fallbackSc[1]) : 0;
                        conc = fallbackConc ? parseInt(fallbackConc[1]) : 0;
                        cnExt = fallbackCnExt ? parseInt(fallbackCnExt[1]) : 0;
                        csExt = fallbackCsExt ? parseInt(fallbackCsExt[1]) : 0;
                    }
                } else if (isEspecial) {
                    const matchEspeciales = obs.match(/\[JSON_ESPECIALES:(.*)\]/) || obs.match(/\[JSON_QUINTAS:(.*)\]/);
                    if (matchEspeciales) {
                        try {
                            const data = JSON.parse(matchEspeciales[1]);
                            especialesData = data;
                            totalEspeciales = (parseInt(data.choferes?.cenas)||0) + (parseInt(data.quintas?.cenas)||0) + (parseInt(data.pilotos?.almuerzos)||0);
                        } catch (e) {
                            console.error('Error parsing Especiales JSON', e);
                        }
                    }
                }
            }

            details.push({
                date: d.service_date.substring(0, 10),
                plc, sm, cnPlanta, cenas, sc, conc, cnExt, csExt,
                sistemasCep, seguridadPlc, seguridadRuices, seguridadCentralCep,
                totalEspeciales, especialesData,
                total: d.attendees || (plc + sm + cnPlanta + cenas + sc + conc + cnExt + csExt + sistemasCep + seguridadPlc + seguridadRuices + seguridadCentralCep + totalEspeciales)
            });
        });
    });
    return details;
};

export const getConsolidatedData = (logs: any[], planningEvents: any[], prices: any[], startDate?: string, endDate?: string) => {
    const isDateInRange = (dateStr: string, start?: string, end?: string) => {
        if (!dateStr) return false;
        if (!start && !end) return true;
        try {
            const d = new Date(dateStr + 'T12:00:00').getTime();
            const s = start ? new Date(start + 'T00:00:00').getTime() : 0;
            const e = end ? new Date(end + 'T23:59:59').getTime() : Infinity;
            return d >= s && d <= e;
        } catch (e) {
            return false;
        }
    };

    const logsInRange = logs.filter(log => isDateInRange(log.log_date.substring(0, 10), startDate, endDate));
    const planningDetails = getPlanningDetails(planningEvents);
    const planningInRange = planningDetails.filter(p => isDateInRange(p.date, startDate, endDate));

    const allDates = Array.from(new Set([
        ...logsInRange.map(l => l.log_date.substring(0, 10)),
        ...planningInRange.map(p => p.date)
    ])).sort();

    return allDates.map(date => {
        const log = logsInRange.find(l => l.log_date.substring(0, 10) === date);
        const sdLog = log?.structured_data || {};
        const real = {
            t1: sdLog.t1 ?? (log ? parseObservations(log.observations).t1 : null),
            t2: sdLog.t2 ?? (log ? parseObservations(log.observations).t2 : null),
            t3: sdLog.t3 ?? (log ? parseObservations(log.observations).t3 : null),
            t4: sdLog.t4 ?? (log ? parseObservations(log.observations).t4 : null),
            manual: sdLog.manual ?? (log ? parseObservations(log.observations).manual : null),
            lunchSold: log ? log.lunch_sold : 0,
            breakfastRevenue: log ? (log.breakfast_revenue || 0) : 0
        };

        const plans = planningInRange.filter(p => p.date === date);
        const plan = {
            plc: plans.reduce((acc, p) => acc + p.plc, 0),
            sm: plans.reduce((acc, p) => acc + p.sm, 0),
            cnPlanta: plans.reduce((acc, p) => acc + p.cnPlanta, 0),
            cenas: plans.reduce((acc, p) => acc + p.cenas, 0),
            sc: plans.reduce((acc, p) => acc + p.sc, 0),
            conc: plans.reduce((acc, p) => acc + p.conc, 0),
            cnExt: plans.reduce((acc, p) => acc + p.cnExt, 0),
            csExt: plans.reduce((acc, p) => acc + p.csExt, 0),
            sistemasCep: plans.reduce((acc, p) => acc + p.sistemasCep || 0, 0),
            seguridadPlc: plans.reduce((acc, p) => acc + p.seguridadPlc || 0, 0),
            seguridadRuices: plans.reduce((acc, p) => acc + p.seguridadRuices || 0, 0),
            seguridadCentralCep: plans.reduce((acc, p) => acc + p.seguridadCentralCep || 0, 0),
            quintas: plans.reduce((acc, p) => acc + (p.totalEspeciales || 0), 0),
            total: plans.reduce((acc, p) => acc + p.total, 0)
        };

        const comedorCount = log ? real.lunchSold : plan.plc;
        const billingComedor = comedorCount * getPriceForDate(prices, date, log ? 'almuerzo_comedor' : 'plc');
        const billingCep = 
            (plan.sistemasCep * getPriceForDate(prices, date, 'sistemas_cep')) +
            (plan.seguridadPlc * getPriceForDate(prices, date, 'seguridad_plc')) +
            (plan.seguridadRuices * getPriceForDate(prices, date, 'seguridad_ruices')) +
            (plan.seguridadCentralCep * getPriceForDate(prices, date, 'seguridad_central'));
        const billingMetroDelivery =
            (plan.sm * getPriceForDate(prices, date, 'sm_almuerzos')) +
            (plan.cnPlanta * getPriceForDate(prices, date, 'col_norte')) +
            (plan.cenas * getPriceForDate(prices, date, 'sm_cenas')) +
            (plan.sc * getPriceForDate(prices, date, 'sm_sobre_cenas')) +
            (plan.conc * getPriceForDate(prices, date, 'concentrados')) +
            (plan.cnExt * getPriceForDate(prices, date, 'col_norte_ext')) +
            (plan.csExt * getPriceForDate(prices, date, 'col_sur'));
            
        const billingMetroTotal = billingMetroDelivery + (plan.plc * getPriceForDate(prices, date, 'plc'));

        const especialesDataForDate = plans.find(p => p.especialesData)?.especialesData || null;
        const quintasData = especialesDataForDate || {};
        const billingQuintas =
            ((quintasData.choferes?.cenas || 0) * getPriceForDate(prices, date, 'cenas_choferes')) +
            ((quintasData.quintas?.cenas || 0) * getPriceForDate(prices, date, 'cenas_quintas')) +
            ((quintasData.pilotos?.almuerzos || 0) * getPriceForDate(prices, date, 'almuerzos_pilotos'));

        const totalGral = comedorCount + plan.sm + plan.cnPlanta + plan.cenas + plan.sc + plan.conc + plan.cnExt + plan.csExt + plan.sistemasCep + plan.seguridadPlc + plan.seguridadRuices + plan.seguridadCentralCep + plan.quintas;
        const billing = billingComedor + billingCep + billingMetroDelivery + billingQuintas;

        return {
            date,
            plan,
            real,
            totalGral,
            billing,
            billingComedor,
            billingMetroDelivery,
            billingMetroTotal,
            billingCep,
            billingQuintas
        };
    });
};
