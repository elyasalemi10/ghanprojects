import { useState } from 'react';
import { motion } from 'framer-motion';
import { Layers, MapPin, Ruler, CheckCircle2, XCircle, AlertCircle, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from '@tanstack/react-router';

type Zone = 'GRZ' | 'NRZ' | 'RGZ' | 'MUZ' | 'C1Z' | 'C2Z' | 'unknown';
type OverlayType = 'none' | 'heritage' | 'environmental' | 'flooding' | 'bushfire';

interface CheckResult {
  canSubdivide: 'yes' | 'maybe' | 'unlikely';
  minimumLotSize: number;
  potentialLots: number;
  considerations: string[];
  nextSteps: string[];
}

const zoneInfo: Record<Zone, { name: string; minLot: number; description: string }> = {
  GRZ: { name: 'General Residential Zone', minLot: 300, description: 'Standard residential, allows multi-dwelling development' },
  NRZ: { name: 'Neighbourhood Residential Zone', minLot: 500, description: 'Lower density residential, more restrictive' },
  RGZ: { name: 'Residential Growth Zone', minLot: 300, description: 'Encourages housing growth and diversity' },
  MUZ: { name: 'Mixed Use Zone', minLot: 200, description: 'Allows residential and commercial uses' },
  C1Z: { name: 'Commercial 1 Zone', minLot: 0, description: 'Commercial with residential above ground floor' },
  C2Z: { name: 'Commercial 2 Zone', minLot: 0, description: 'Office, industry, and limited retail' },
  unknown: { name: 'Unknown Zone', minLot: 400, description: 'Please check your local planning scheme' },
};

export function SubdivisionChecker() {
  const [lotSize, setLotSize] = useState<string>('');
  const [zone, setZone] = useState<Zone>('GRZ');
  const [overlay, setOverlay] = useState<OverlayType>('none');
  const [hasExistingDwelling, setHasExistingDwelling] = useState(true);
  const [streetFrontage, setStreetFrontage] = useState<string>('');
  const [result, setResult] = useState<CheckResult | null>(null);

  const checkSubdivision = () => {
    const size = parseFloat(lotSize.replace(/,/g, '')) || 0;
    const frontage = parseFloat(streetFrontage) || 0;
    
    if (size <= 0) return;

    const zoneData = zoneInfo[zone];
    const minLot = zoneData.minLot;
    const potentialLots = minLot > 0 ? Math.floor(size / minLot) : 1;
    
    const considerations: string[] = [];
    const nextSteps: string[] = [];
    let canSubdivide: 'yes' | 'maybe' | 'unlikely' = 'unlikely';

    if (size >= minLot * 2) {
      canSubdivide = 'yes';
      considerations.push(`Your lot size of ${size.toLocaleString()}m² exceeds the minimum required for ${potentialLots} lots.`);
    } else if (size >= minLot * 1.5) {
      canSubdivide = 'maybe';
      considerations.push(`Your lot may accommodate subdivision with careful planning and council negotiation.`);
    } else {
      canSubdivide = 'unlikely';
      considerations.push(`Your lot size of ${size.toLocaleString()}m² is below the typical minimum for subdivision in this zone.`);
    }

    if (frontage > 0 && frontage < 15) {
      if (canSubdivide === 'yes') canSubdivide = 'maybe';
      considerations.push(`Limited street frontage (${frontage}m) may restrict subdivision options.`);
    } else if (frontage >= 20) {
      considerations.push(`Good street frontage (${frontage}m) provides flexibility for access arrangements.`);
    }

    if (overlay === 'heritage') {
      if (canSubdivide === 'yes') canSubdivide = 'maybe';
      considerations.push('Heritage overlay may restrict demolition and development options.');
    } else if (overlay === 'environmental') {
      considerations.push('Environmental overlay will require additional assessments and may affect buildable area.');
    } else if (overlay === 'flooding') {
      if (canSubdivide === 'yes') canSubdivide = 'maybe';
      considerations.push('Flooding overlay will require flood studies and may impact floor levels.');
    } else if (overlay === 'bushfire') {
      considerations.push('Bushfire overlay requires BAL assessment and may affect defendable space requirements.');
    }

    if (hasExistingDwelling) {
      considerations.push('Existing dwelling may be retained as part of the subdivision or demolished for new development.');
    }

    if (zone === 'NRZ') {
      considerations.push('NRZ has additional restrictions including mandatory garden area and maximum building height of 9m.');
    }

    nextSteps.push('Obtain a Planning Certificate (Section 32) from your local council');
    nextSteps.push('Commission a land survey to confirm exact boundaries and dimensions');
    
    if (canSubdivide !== 'unlikely') {
      nextSteps.push('Engage a town planner to assess development potential');
      nextSteps.push('Consider a pre-application meeting with council');
    }
    
    nextSteps.push('Book a consultation with our team for a detailed feasibility assessment');

    setResult({
      canSubdivide,
      minimumLotSize: minLot,
      potentialLots: Math.max(1, potentialLots),
      considerations,
      nextSteps
    });
  };

  const handleNumberInput = (value: string, setter: (val: string) => void) => {
    const cleaned = value.replace(/[^0-9.]/g, '');
    setter(cleaned);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="bg-background border shadow-lg"
    >
      <div className="p-6 sm:p-8 border-b bg-primary/5">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center text-accent">
            <Layers size={20} />
          </div>
          <h3 className="text-2xl font-heading font-bold text-primary">Subdivision Potential Checker</h3>
        </div>
        <p className="text-muted-foreground text-sm">Get a preliminary assessment of your property's subdivision potential.</p>
      </div>

      <div className="p-6 sm:p-8 space-y-6">
        {/* Lot Size */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-primary flex items-center gap-2">
            <Ruler size={14} className="text-accent" />
            Total Lot Size (m²)
          </label>
          <input
            type="text"
            value={lotSize ? parseFloat(lotSize).toLocaleString() : ''}
            onChange={(e) => handleNumberInput(e.target.value, setLotSize)}
            placeholder="800"
            className="w-full bg-secondary/30 border border-border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent text-lg"
          />
        </div>

        {/* Street Frontage */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-primary flex items-center gap-2">
            <MapPin size={14} className="text-accent" />
            Street Frontage (metres)
          </label>
          <input
            type="text"
            value={streetFrontage}
            onChange={(e) => handleNumberInput(e.target.value, setStreetFrontage)}
            placeholder="18"
            className="w-full bg-secondary/30 border border-border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>

        {/* Zone Selection */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-primary">Planning Zone</label>
          <select
            value={zone}
            onChange={(e) => setZone(e.target.value as Zone)}
            className="w-full bg-secondary/30 border border-border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent appearance-none cursor-pointer"
          >
            <option value="GRZ">General Residential Zone (GRZ)</option>
            <option value="NRZ">Neighbourhood Residential Zone (NRZ)</option>
            <option value="RGZ">Residential Growth Zone (RGZ)</option>
            <option value="MUZ">Mixed Use Zone (MUZ)</option>
            <option value="C1Z">Commercial 1 Zone (C1Z)</option>
            <option value="C2Z">Commercial 2 Zone (C2Z)</option>
            <option value="unknown">I'm not sure</option>
          </select>
          <p className="text-xs text-muted-foreground">{zoneInfo[zone].description}</p>
        </div>

        {/* Overlay */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-primary">Planning Overlays</label>
          <select
            value={overlay}
            onChange={(e) => setOverlay(e.target.value as OverlayType)}
            className="w-full bg-secondary/30 border border-border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent appearance-none cursor-pointer"
          >
            <option value="none">No significant overlays</option>
            <option value="heritage">Heritage Overlay (HO)</option>
            <option value="environmental">Environmental Significance Overlay (ESO)</option>
            <option value="flooding">Land Subject to Inundation Overlay (LSIO)</option>
            <option value="bushfire">Bushfire Management Overlay (BMO)</option>
          </select>
        </div>

        {/* Existing Dwelling */}
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="existingDwelling"
            checked={hasExistingDwelling}
            onChange={(e) => setHasExistingDwelling(e.target.checked)}
            className="w-5 h-5 rounded border-border text-accent focus:ring-accent"
          />
          <label htmlFor="existingDwelling" className="text-sm text-primary cursor-pointer">
            Property has an existing dwelling
          </label>
        </div>

        <Button
          onClick={checkSubdivision}
          className="w-full rounded-none bg-accent hover:bg-accent/90 text-white py-6 font-heading font-bold uppercase tracking-wider"
        >
          Check Subdivision Potential
        </Button>

        {result && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="border-t pt-6 space-y-6"
          >
            <h4 className="text-lg font-heading font-bold text-primary">Assessment Results</h4>
            
            {/* Result Badge */}
            <div className={`p-6 flex items-center gap-4 ${
              result.canSubdivide === 'yes' 
                ? 'bg-green-50 border border-green-200' 
                : result.canSubdivide === 'maybe'
                ? 'bg-amber-50 border border-amber-200'
                : 'bg-red-50 border border-red-200'
            }`}>
              {result.canSubdivide === 'yes' ? (
                <CheckCircle2 size={32} className="text-green-600 shrink-0" />
              ) : result.canSubdivide === 'maybe' ? (
                <AlertCircle size={32} className="text-amber-600 shrink-0" />
              ) : (
                <XCircle size={32} className="text-red-600 shrink-0" />
              )}
              <div>
                <p className={`text-lg font-bold ${
                  result.canSubdivide === 'yes' 
                    ? 'text-green-800' 
                    : result.canSubdivide === 'maybe'
                    ? 'text-amber-800'
                    : 'text-red-800'
                }`}>
                  {result.canSubdivide === 'yes' 
                    ? 'Good Subdivision Potential' 
                    : result.canSubdivide === 'maybe'
                    ? 'Possible with Further Assessment'
                    : 'Subdivision Unlikely'}
                </p>
                <p className={`text-sm ${
                  result.canSubdivide === 'yes' 
                    ? 'text-green-600' 
                    : result.canSubdivide === 'maybe'
                    ? 'text-amber-600'
                    : 'text-red-600'
                }`}>
                  {result.canSubdivide === 'yes'
                    ? `Potential for up to ${result.potentialLots} lots based on minimum lot size of ${result.minimumLotSize}m²`
                    : result.canSubdivide === 'maybe'
                    ? 'Professional assessment recommended to determine feasibility'
                    : 'Property may not meet minimum requirements for subdivision'}
                </p>
              </div>
            </div>

            {/* Considerations */}
            <div className="bg-secondary/30 p-6 space-y-4">
              <h5 className="font-bold text-primary text-sm uppercase tracking-wider">Key Considerations</h5>
              <ul className="space-y-3">
                {result.considerations.map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                    <ChevronRight size={16} className="text-accent mt-0.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Next Steps */}
            <div className="bg-primary/5 p-6 space-y-4">
              <h5 className="font-bold text-primary text-sm uppercase tracking-wider">Recommended Next Steps</h5>
              <ol className="space-y-3">
                {result.nextSteps.map((step, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-primary">
                    <span className="w-6 h-6 rounded-full bg-accent text-white flex items-center justify-center text-xs font-bold shrink-0">
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>

            {/* CTA */}
            <div className="bg-accent/10 p-6 border border-accent/20">
              <p className="text-sm text-primary mb-4">
                Want a detailed feasibility assessment for your property? Our team can provide a comprehensive analysis 
                including development scenarios, cost estimates, and profit projections.
              </p>
              <Button asChild className="rounded-none bg-accent hover:bg-accent/90 text-white">
                <Link to="/book-consultation">Book Free Consultation</Link>
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              * This is a preliminary assessment only. Actual subdivision potential depends on many factors including 
              specific council requirements, site conditions, and current planning policies. Professional advice is recommended.
            </p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
