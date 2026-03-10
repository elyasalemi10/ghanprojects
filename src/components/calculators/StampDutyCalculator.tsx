import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calculator, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CalculationResult {
  stampDuty: number;
  transferFee: number;
  totalCosts: number;
  effectiveRate: number;
}

type State = 'VIC' | 'NSW' | 'QLD' | 'SA' | 'WA' | 'TAS' | 'NT' | 'ACT';

const STATE_OPTIONS: { value: State; label: string }[] = [
  { value: 'VIC', label: 'Victoria' },
  { value: 'NSW', label: 'New South Wales' },
  { value: 'QLD', label: 'Queensland' },
  { value: 'SA', label: 'South Australia' },
  { value: 'WA', label: 'Western Australia' },
  { value: 'TAS', label: 'Tasmania' },
  { value: 'NT', label: 'Northern Territory' },
  { value: 'ACT', label: 'Australian Capital Territory' },
];

export function StampDutyCalculator() {
  const [state, setState] = useState<State>('VIC');
  const [propertyValue, setPropertyValue] = useState<string>('');
  const [landArea, setLandArea] = useState<string>('');
  const [isCommercial, setIsCommercial] = useState<boolean>(false);
  const [result, setResult] = useState<CalculationResult | null>(null);

  const calculateStampDuty = (value: number, selectedState: State): number => {
    switch (selectedState) {
      case 'VIC':
        if (value <= 25000) return value * 0.014;
        if (value <= 130000) return 350 + (value - 25000) * 0.024;
        if (value <= 960000) return 2870 + (value - 130000) * 0.06;
        if (value <= 2000000) return 52670 + (value - 960000) * 0.055;
        return 109870 + (value - 2000000) * 0.065;
      
      case 'NSW':
        if (value <= 16000) return value * 0.0125;
        if (value <= 35000) return 200 + (value - 16000) * 0.015;
        if (value <= 93000) return 485 + (value - 35000) * 0.0175;
        if (value <= 351000) return 1500 + (value - 93000) * 0.035;
        if (value <= 1168000) return 10530 + (value - 351000) * 0.045;
        if (value <= 3505000) return 47295 + (value - 1168000) * 0.055;
        return 175830 + (value - 3505000) * 0.07;
      
      case 'QLD':
        if (value <= 5000) return 0;
        if (value <= 75000) return (value - 5000) * 0.015;
        if (value <= 540000) return 1050 + (value - 75000) * 0.035;
        if (value <= 1000000) return 17325 + (value - 540000) * 0.045;
        return 38025 + (value - 1000000) * 0.0575;
      
      case 'SA':
        if (value <= 12000) return value * 0.01;
        if (value <= 30000) return 120 + (value - 12000) * 0.02;
        if (value <= 50000) return 480 + (value - 30000) * 0.03;
        if (value <= 100000) return 1080 + (value - 50000) * 0.035;
        if (value <= 200000) return 2830 + (value - 100000) * 0.04;
        if (value <= 250000) return 6830 + (value - 200000) * 0.0425;
        if (value <= 300000) return 8955 + (value - 250000) * 0.0475;
        if (value <= 500000) return 11330 + (value - 300000) * 0.05;
        return 21330 + (value - 500000) * 0.055;
      
      case 'WA':
        if (value <= 120000) return value * 0.019;
        if (value <= 150000) return 2280 + (value - 120000) * 0.0285;
        if (value <= 360000) return 3135 + (value - 150000) * 0.038;
        if (value <= 725000) return 11115 + (value - 360000) * 0.0475;
        return 28452.50 + (value - 725000) * 0.0515;
      
      case 'TAS':
        if (value <= 3000) return 50;
        if (value <= 25000) return 50 + (value - 3000) * 0.0175;
        if (value <= 75000) return 435 + (value - 25000) * 0.0225;
        if (value <= 200000) return 1560 + (value - 75000) * 0.035;
        if (value <= 375000) return 5935 + (value - 200000) * 0.04;
        if (value <= 725000) return 12935 + (value - 375000) * 0.0425;
        return 27810 + (value - 725000) * 0.045;
      
      case 'NT':
        if (value <= 525000) return value * 0.0495 * (1.8 - (value / 1000000));
        return value * 0.0495;
      
      case 'ACT':
        if (value <= 260000) return value * 0.006;
        if (value <= 300000) return 1560 + (value - 260000) * 0.023;
        if (value <= 500000) return 2480 + (value - 300000) * 0.0405;
        if (value <= 750000) return 10580 + (value - 500000) * 0.0505;
        if (value <= 1000000) return 23205 + (value - 750000) * 0.0565;
        if (value <= 1455000) return 37330 + (value - 1000000) * 0.054;
        return 61900 + (value - 1455000) * 0.072;
      
      default:
        return value * 0.05;
    }
  };

  const calculate = () => {
    const value = parseFloat(propertyValue.replace(/,/g, '')) || 0;
    if (value <= 0) return;

    const area = parseFloat(landArea) || 0;
    let stampDuty = calculateStampDuty(value, state);
    
    if (area > 2 && isCommercial) {
      stampDuty = stampDuty * 1.1;
    }

    const transferFee = state === 'VIC' 
      ? Math.max(143.30, value * 0.00024) 
      : value * 0.0002;
    
    const totalCosts = stampDuty + transferFee;
    const effectiveRate = (stampDuty / value) * 100;

    setResult({
      stampDuty,
      transferFee,
      totalCosts,
      effectiveRate
    });
  };

  const clearForm = () => {
    setState('VIC');
    setPropertyValue('');
    setLandArea('');
    setIsCommercial(false);
    setResult(null);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const handleCurrencyInput = (value: string) => {
    const cleaned = value.replace(/[^0-9]/g, '');
    setPropertyValue(cleaned);
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
            <Calculator size={20} />
          </div>
          <div>
            <h3 className="text-2xl font-heading font-bold text-primary uppercase tracking-wide">
              {isCommercial ? 'Commercial Properties' : 'Stamp Duty Calculator'}
            </h3>
            {isCommercial && (
              <p className="text-sm text-muted-foreground">Stamp Duty Calculator Notice For {STATE_OPTIONS.find(s => s.value === state)?.label}</p>
            )}
          </div>
        </div>
        {!isCommercial && (
          <p className="text-muted-foreground text-sm">Calculate stamp duty for property purchases across Australia</p>
        )}
      </div>

      <div className="p-6 sm:p-8 space-y-6">
        <div className="grid md:grid-cols-2 gap-x-8 gap-y-6">
          {/* Left Column */}
          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-primary">State</label>
              <div className="relative">
                <select
                  value={state}
                  onChange={(e) => setState(e.target.value as State)}
                  className="w-full bg-transparent border-b border-border px-0 py-2 focus:outline-none focus:border-accent appearance-none cursor-pointer"
                >
                  {STATE_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <span className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none">▼</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-primary">Property Value</label>
              <input
                type="text"
                value={propertyValue ? parseInt(propertyValue).toLocaleString() : ''}
                onChange={(e) => handleCurrencyInput(e.target.value)}
                placeholder="Enter property value"
                className="w-full bg-transparent border-b border-border px-0 py-2 focus:outline-none focus:border-accent transition-colors"
              />
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-primary">Land Area (Hectares {'>'} 2)</label>
              <input
                type="number"
                value={landArea}
                onChange={(e) => setLandArea(e.target.value)}
                placeholder="Enter land area in hectares"
                step="0.1"
                className="w-full bg-transparent border-b border-border px-0 py-2 focus:outline-none focus:border-accent transition-colors"
              />
            </div>

            <div className="flex items-center gap-3 py-2">
              <input
                type="checkbox"
                id="isCommercial"
                checked={isCommercial}
                onChange={(e) => setIsCommercial(e.target.checked)}
                className="w-4 h-4 rounded border-border text-accent focus:ring-accent"
              />
              <label htmlFor="isCommercial" className="text-sm text-primary cursor-pointer">
                Commercial Property
              </label>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <Button
            onClick={calculate}
            className="flex-1 rounded-full border-2 border-primary bg-transparent text-primary hover:bg-primary hover:text-white py-6 font-heading font-bold uppercase tracking-wider transition-all"
          >
            Calculate
          </Button>
          <Button
            onClick={clearForm}
            variant="outline"
            className="flex-1 rounded-full border-2 border-accent bg-transparent text-accent hover:bg-accent/10 py-6 font-heading font-medium tracking-wider transition-all"
          >
            <RotateCcw size={16} className="mr-2" />
            Clear form
          </Button>
        </div>

        {result && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="border-t pt-6 space-y-6"
          >
            <h4 className="text-lg font-heading font-bold text-primary">Results for {STATE_OPTIONS.find(s => s.value === state)?.label}</h4>
            
            <div className="bg-primary p-6 text-white">
              <span className="text-sm text-white/70 uppercase tracking-wider">Total Government Costs</span>
              <p className="text-4xl font-heading font-bold mt-1">{formatCurrency(result.totalCosts)}</p>
              <p className="text-sm text-white/60 mt-2">Effective Rate: {result.effectiveRate.toFixed(2)}%</p>
            </div>

            <div className="bg-secondary/30 p-6 space-y-3">
              <h5 className="font-bold text-primary text-sm uppercase tracking-wider">Breakdown</h5>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Stamp Duty</span>
                  <span className="font-medium text-primary">{formatCurrency(result.stampDuty)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Transfer Fee</span>
                  <span className="font-medium text-primary">{formatCurrency(result.transferFee)}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="font-medium text-primary">Total</span>
                  <span className="font-bold text-accent">{formatCurrency(result.totalCosts)}</span>
                </div>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              * Calculations are estimates based on standard rates. Actual stamp duty may vary based on 
              property type, buyer status, and current government policies. Please consult with your 
              conveyancer for exact figures.
            </p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
