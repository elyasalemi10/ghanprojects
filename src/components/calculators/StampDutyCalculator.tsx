import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calculator, RotateCcw, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CalculationResult {
  stampDuty: number;
  transferFee: number;
  totalCosts: number;
  effectiveRate: number;
}

type State = 'VIC' | 'NSW' | 'QLD' | 'SA' | 'WA' | 'TAS' | 'NT' | 'ACT';
type WARate = 'general' | 'concessional' | 'first-home' | 'first-home-vacant';
type ACTType = 'owner-occupier' | 'investor';

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

const WA_RATES: { value: WARate; label: string }[] = [
  { value: 'general', label: 'General Rate' },
  { value: 'concessional', label: 'Concessional Rate' },
  { value: 'first-home', label: 'First Home Owners Rate - Home' },
  { value: 'first-home-vacant', label: 'First Home Owners Rate - Vacant Land' },
];

export function StampDutyCalculator() {
  const [state, setState] = useState<State>('VIC');
  const [propertyValue, setPropertyValue] = useState<string>('');
  const [landArea, setLandArea] = useState<string>('');
  const [waRate, setWaRate] = useState<WARate>('general');
  const [actType, setActType] = useState<ACTType>('investor');
  const [result, setResult] = useState<CalculationResult | null>(null);

  useEffect(() => {
    setResult(null);
  }, [state]);

  const calculateStampDuty = (value: number, selectedState: State): number => {
    switch (selectedState) {
      case 'VIC':
        if (value <= 25000) return value * 0.014;
        if (value <= 130000) return 350 + (value - 25000) * 0.024;
        if (value <= 960000) return 2870 + (value - 130000) * 0.06;
        if (value <= 2000000) return 52670 + (value - 960000) * 0.055;
        return 109870 + (value - 2000000) * 0.065;
      
      case 'NSW': {
        const area = parseFloat(landArea) || 0;
        let duty = 0;
        if (value <= 16000) duty = value * 0.0125;
        else if (value <= 35000) duty = 200 + (value - 16000) * 0.015;
        else if (value <= 93000) duty = 485 + (value - 35000) * 0.0175;
        else if (value <= 351000) duty = 1500 + (value - 93000) * 0.035;
        else if (value <= 1168000) duty = 10530 + (value - 351000) * 0.045;
        else if (value <= 3505000) duty = 47295 + (value - 1168000) * 0.055;
        else duty = 175830 + (value - 3505000) * 0.07;
        if (area > 2) duty = duty * 1.1;
        return duty;
      }
      
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
      
      case 'WA': {
        if (waRate === 'first-home' && value <= 430000) return 0;
        if (waRate === 'first-home-vacant' && value <= 300000) return 0;
        
        const rate = waRate === 'concessional' ? 0.8 : 1;
        let duty = 0;
        if (value <= 120000) duty = value * 0.019;
        else if (value <= 150000) duty = 2280 + (value - 120000) * 0.0285;
        else if (value <= 360000) duty = 3135 + (value - 150000) * 0.038;
        else if (value <= 725000) duty = 11115 + (value - 360000) * 0.0475;
        else duty = 28452.50 + (value - 725000) * 0.0515;
        return duty * rate;
      }
      
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
      
      case 'ACT': {
        const isOwnerOccupier = actType === 'owner-occupier';
        if (isOwnerOccupier) {
          if (value <= 260000) return value * 0.006;
          if (value <= 300000) return 1560 + (value - 260000) * 0.023;
          if (value <= 500000) return 2480 + (value - 300000) * 0.0405;
          if (value <= 750000) return 10580 + (value - 500000) * 0.0505;
          if (value <= 1000000) return 23205 + (value - 750000) * 0.0565;
          if (value <= 1455000) return 37330 + (value - 1000000) * 0.054;
          return 61900 + (value - 1455000) * 0.072;
        } else {
          if (value <= 200000) return value * 0.012;
          if (value <= 300000) return 2400 + (value - 200000) * 0.0345;
          if (value <= 500000) return 5850 + (value - 300000) * 0.0435;
          if (value <= 750000) return 14550 + (value - 500000) * 0.055;
          if (value <= 1000000) return 28300 + (value - 750000) * 0.058;
          return 42800 + (value - 1000000) * 0.072;
        }
      }
      
      default:
        return value * 0.05;
    }
  };

  const calculate = () => {
    const value = parseFloat(propertyValue.replace(/,/g, '')) || 0;
    if (value <= 0) return;

    const stampDuty = calculateStampDuty(value, state);
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
    setPropertyValue('');
    setLandArea('');
    setWaRate('general');
    setActType('investor');
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

  const handleNumberInput = (value: string, setter: (val: string) => void) => {
    const cleaned = value.replace(/[^0-9.]/g, '');
    setter(cleaned);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="bg-white rounded-xl shadow-xl overflow-hidden"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 p-6 sm:p-8 text-white">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
            <Calculator size={28} />
          </div>
          <div>
            <h3 className="text-2xl sm:text-3xl font-heading font-bold">Stamp Duty Calculator</h3>
            <p className="text-white/70 text-sm mt-1">Calculate stamp duty across all Australian states</p>
          </div>
        </div>
      </div>

      <div className="p-6 sm:p-8 space-y-6">
        {/* State Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Select State/Territory</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {STATE_OPTIONS.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setState(opt.value)}
                className={`p-3 text-sm font-medium rounded-lg border-2 transition-all ${
                  state === opt.value 
                    ? 'border-accent bg-accent/5 text-accent' 
                    : 'border-gray-200 hover:border-gray-300 text-gray-600'
                }`}
              >
                {opt.value}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-2">Selected: {STATE_OPTIONS.find(s => s.value === state)?.label}</p>
        </div>

        {/* State-specific fields */}
        <div className="space-y-4">
          {/* NSW - Land Area */}
          {state === 'NSW' && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <label className="block text-sm font-medium text-gray-700 mb-2">Land Area (Hectares)</label>
              <input
                type="text"
                value={landArea}
                onChange={(e) => handleNumberInput(e.target.value, setLandArea)}
                placeholder="Enter land area (leave empty if < 2 hectares)"
                className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
              />
              <p className="text-xs text-gray-400 mt-1">Additional duty applies for properties over 2 hectares</p>
            </motion.div>
          )}

          {/* WA - Rate Selection */}
          {state === 'WA' && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <label className="block text-sm font-medium text-gray-700 mb-2">Rate Type</label>
              <select
                value={waRate}
                onChange={(e) => setWaRate(e.target.value as WARate)}
                className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent/50 appearance-none cursor-pointer bg-white"
              >
                {WA_RATES.map(rate => (
                  <option key={rate.value} value={rate.value}>{rate.label}</option>
                ))}
              </select>
              {waRate.includes('first-home') && (
                <p className="text-xs text-green-600 mt-1">
                  First home buyer concessions may apply. Check eligibility requirements.
                </p>
              )}
            </motion.div>
          )}

          {/* ACT - Owner Type */}
          {state === 'ACT' && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <label className="block text-sm font-medium text-gray-700 mb-2">Buyer Type</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setActType('owner-occupier')}
                  className={`p-4 text-sm font-medium rounded-lg border-2 transition-all ${
                    actType === 'owner-occupier' 
                      ? 'border-accent bg-accent/5 text-accent' 
                      : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  }`}
                >
                  Eligible Owner Occupier
                </button>
                <button
                  type="button"
                  onClick={() => setActType('investor')}
                  className={`p-4 text-sm font-medium rounded-lg border-2 transition-all ${
                    actType === 'investor' 
                      ? 'border-accent bg-accent/5 text-accent' 
                      : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  }`}
                >
                  Investor
                </button>
              </div>
            </motion.div>
          )}

          {/* Property Value - Always shown */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Property Value</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">$</span>
              <input
                type="text"
                value={propertyValue ? parseInt(propertyValue).toLocaleString() : ''}
                onChange={(e) => handleCurrencyInput(e.target.value)}
                placeholder="750,000"
                className="w-full border border-gray-200 rounded-lg pl-8 pr-4 py-4 text-lg focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <Button
            onClick={calculate}
            className="flex-1 rounded-xl bg-primary hover:bg-primary/90 text-white py-6 font-heading font-bold uppercase tracking-wider transition-all shadow-lg shadow-primary/20"
          >
            Calculate
          </Button>
          <Button
            onClick={clearForm}
            variant="outline"
            className="flex-1 rounded-xl border-2 border-gray-200 text-gray-600 hover:bg-gray-50 py-6 font-medium tracking-wider transition-all"
          >
            <RotateCcw size={16} className="mr-2" />
            Clear
          </Button>
        </div>

        {/* Results */}
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="pt-6 border-t space-y-6"
          >
            <h4 className="text-lg font-heading font-bold text-primary">
              Results for {STATE_OPTIONS.find(s => s.value === state)?.label}
            </h4>
            
            {/* Main Result Card */}
            <div className="bg-gradient-to-br from-accent to-accent/80 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/70 text-sm font-medium">Total Government Costs</p>
                  <p className="text-4xl font-heading font-bold mt-1">{formatCurrency(result.totalCosts)}</p>
                  <p className="text-sm text-white/60 mt-2">Effective Rate: {result.effectiveRate.toFixed(2)}%</p>
                </div>
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                  <DollarSign size={32} />
                </div>
              </div>
            </div>

            {/* Breakdown */}
            <div className="bg-gray-50 rounded-xl p-6 space-y-3">
              <h5 className="font-bold text-primary text-sm uppercase tracking-wider">Cost Breakdown</h5>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600">Stamp Duty</span>
                  <span className="font-bold text-primary text-lg">{formatCurrency(result.stampDuty)}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600">Transfer Fee</span>
                  <span className="font-medium text-primary">{formatCurrency(result.transferFee)}</span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                  <span className="font-bold text-primary">Total</span>
                  <span className="font-bold text-accent text-xl">{formatCurrency(result.totalCosts)}</span>
                </div>
              </div>
            </div>

            <p className="text-xs text-gray-400">
              * Calculations are estimates based on standard rates as of 2024. Actual stamp duty may vary based on 
              concessions, exemptions, and current government policies. Please consult with your conveyancer for exact figures.
            </p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
