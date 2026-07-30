import axios from 'axios';

async function test() {
    try {
        const { execSync } = await import('child_process');
        
        const output = execSync('cd ../DEV\\ -\\ ArreguiBackend && source venv/bin/activate && python get_events.py', {maxBuffer: 1024*1024*10}).toString();
        const eventsRes = { data: JSON.parse(output) };
        
        const planningEvents = eventsRes.data.filter(ev => ev.company === 'Planificación');
        
        const detailsMap = new Map();
        planningEvents.forEach((ev) => {
            (ev.details || []).forEach((d) => {
                const date = d.service_date.substring(0, 10);
                if (!detailsMap.has(date)) {
                    detailsMap.set(date, { date, plc:0, sm:0, cnPlanta:0, cenas:0, sc:0, conc:0, cnExt:0, csExt:0, sistemasCep:0, seguridadPlc:0, seguridadRuices:0, seguridadCentralCep:0, choferesCenas:0, quintasCenas:0, pilotosAlmuerzos:0, choferesDesayunos:0, quintasDesayunos:0, pepsicoDesayunos:0 });
                }
                const p = detailsMap.get(date);
                
                const isMetropolitano = ev.cost_center === 'Metropolitano';
                let sd = d.structured_data;
                if (typeof sd === 'string') {
                    try { sd = JSON.parse(sd); } catch(e) { sd = {}; }
                }

                if (sd && Object.keys(sd).length > 0) {
                    if (isMetropolitano || d.service_category_id === 4 || d.service_category_id === 1) {
                        p.plc += parseInt(sd.plc) || 0;
                        p.sm += parseInt(sd.sm) || 0;
                        p.cnPlanta += parseInt(sd.cnPlanta) || 0;
                        p.cenas += parseInt(sd.cenas) || 0;
                        p.sc += parseInt(sd.sc) || 0;
                        p.conc += parseInt(sd.conc) || 0;
                        p.cnExt += parseInt(sd.cnExt) || 0;
                        p.csExt += parseInt(sd.csExt) || 0;
                    }
                }
            });
        });
        const parsedPlannings = Array.from(detailsMap.values());
        
        console.log("Parsed Plannings for 2026-07-29:", parsedPlannings.find(p => p.date === '2026-07-29'));
        
        const activeListTab = 'metropolitano';
        const evs = planningEvents.filter(ev => {
            if (activeListTab === 'metropolitano') {
                return ev.cost_center === 'Metropolitano' || (ev.title && ev.title.includes('Metropolitano')) || (ev.details && ev.details.some(d => d.service_category_id === 4 || d.service_category_id === 1 || (d.observations && (d.observations.includes('DESGLOSE_PLANIFICACION:') || (d.observations.includes('PLC=') && !d.observations.includes('SEG_PLC='))))));
            }
            return false;
        });
        
        const itemsList = [];
        evs.forEach(ev => {
            if(ev.details) {
                ev.details.forEach(d => {
                    const date = d.service_date.substring(0,10);
                    let sd = d.structured_data;
                    if (typeof sd === 'string') {
                        try { sd = JSON.parse(sd); } catch(e) { sd = {}; }
                    }
                    itemsList.push({ evId: ev.id, date, observations: d.observations || '', structured_data: sd, service_category_id: d.service_category_id });
                });
            }
        });
        
        console.log("List Tab Items for 2026-07-29:", itemsList.filter(i => i.date === '2026-07-29'));
        
        itemsList.filter(i => i.date === '2026-07-29').forEach(item => {
            let summaryText = '';
            if (item.structured_data && Object.keys(item.structured_data).length > 0) {
                const tot = (parseInt(item.structured_data.plc)||0) + (parseInt(item.structured_data.sm)||0) + (parseInt(item.structured_data.cnPlanta)||0) + (parseInt(item.structured_data.cenas)||0) + (parseInt(item.structured_data.sc)||0) + (parseInt(item.structured_data.conc)||0) + (parseInt(item.structured_data.cnExt)||0) + (parseInt(item.structured_data.csExt)||0);
                summaryText = `Total Platos: ${tot}`;
            }
            console.log("List Tab Rendering:", summaryText);
        });

    } catch(e) {
        console.error(e);
    }
}
test();
