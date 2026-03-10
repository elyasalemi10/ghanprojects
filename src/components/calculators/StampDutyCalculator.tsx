import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calculator, DollarSign, Home, Building2, Percent } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CalculationResult {
  stampDuty: number;
  transferFee: number;
  mortgageRegistration: number;
  totalCosts: number;
  foreignSurcharge: number;
  concession: number;
  finalStampDuty: number;
}

type PropertyType = 'principal' | 'investment';
type BuyerType = 'standard' | 'first-home' | 'foreign';

export function StampDutyCalculator() {
  const [propertyValue, setPropertyValue] = useState<string>('');
  const [propertyType, setPropertyType] = useState<PropertyType>('principal');
  const [buyerType, setBuyerType] = useState<BuyerType>('standard');
  const [isOffPlan, setIsOffPlan] = useState(false);
  const [result, setResult] = useState<CalculationResult | null>(null);

  const calculateStampDuty = (value: number): number => {
    if (value <= 25000) {
      return value * 0.014;
    } else if (value <= 130000) {
      return 350 + (value - 25000) * 0.024;
    } else if (value <= 960000) {
      return 2870 + (value - 130000) * 0.06;
    } else if (value <= 2000000) {
      return 52670 + (value - 960000) * 0.055;
    } else {
      return 109870 + (value - 2000000) * 0.065;
    }
  };

  const calculateFirstHomeBuyerConcession = (value: number, baseDuty: number): number => {
    if (value <= 600000) {
      return baseDuty;
    } else if (value <= 750000) {
      const reduction = 1 - ((value - 600000) / 150000);
      return baseDuty * reduction;
    }
    return 0;
  };

  const calculate = () => {
    const value = parseFloat(propertyValue.replace(/,/g, '')) || 0;
    if (value <= 0) return;

    let baseStampDuty = calculateStampDuty(value);
    let concession = 0;
    let foreignSurcharge = 0;

    if (buyerType === 'first-home' && propertyType === 'principal') {
      concession = calculateFirstHomeBuyerConcession(value, baseStampDuty);
    }

    if (buyerType === 'foreign') {
      foreignSurcharge = value * 0.08;
    }

    if (isOffPlan && propertyType === 'principal') {
      const landValue = value * 0.4;
      baseStampDuty = calculateStampDuty(landValue);
    }

    const finalStampDuty = Math.max(0, baseStampDuty - concession + foreignSurcharge);
    const transferFee = value <= 1000000 ? Math.max(143.30, value * 0.00024) : value * 0.00024;
    const mortgageRegistration = 121.40;
    const totalCosts = finalStampDuty + transferFee + mortgageRegistration;

    setResult({
      stampDuty: baseStampDuty,
      transferFee,
      mortgageRegistration,
      totalCosts,
      foreignSurcharge,
      concession,
      finalStampDuty
    });
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
          <h3 className="text-2xl font-heading font-bold text-primary">Victorian Stamp Duty Calculator</h3>
        </div>
        <p className="text-muted-foreground text-sm">Calculate stamp duty and government fees for Victorian property purchases.</p>
      </div>

      <div className="p-6 sm:p-8 space-y-6">
        {/* Property Value */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-primary flex items-center gap-2">
            <DollarSign size={14} className="text-accent" />
            Property Purchase Price
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
            <input
              type="text"
              value={propertyValue ? parseInt(propertyValue).toLocaleString() : ''}
              onChange={(e) => handleCurrencyInput(e.target.value)}
              placeholder="750,000"
              className="w-full bg-secondary/30 border border-border pl-8 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent text-lg"
            />
          </div>
        </div>

        {/* Property Type */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-primary">Property Use</label>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setPropertyType('principal')}
              className={`p-4 border flex items-center gap-3 transition-all ${
                propertyType === 'principal' 
                  ? 'border-accent bg-accent/5 text-accent' 
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <Home size={20} />
              <div className="text-left">
                <p className="font-medium">Principal Residence</p>
                <p className="text-xs text-muted-foreground">I will live here</p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setPropertyType('investment')}
              className={`p-4 border flex items-center gap-3 transition-all ${
                propertyType === 'investment' 
                  ? 'border-accent bg-accent/5 text-accent' 
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <Building2 size={20} />
              <div className="text-left">
                <p className="font-medium">Investment Property</p>
                <p className="text-xs text-muted-foreground">Rental or vacant</p>
              </div>
            </button>
          </div>
        </div>

        {/* Buyer Type */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-primary">Buyer Type</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setBuyerType('standard')}
              className={`p-3 border text-sm font-medium transition-all ${
                buyerType === 'standard' 
                  ? 'border-accent bg-accent text-white' 
                  : 'border-border hover:border-primary/50'
              }`}
            >
              Standard Buyer
            </button>
            <button
              type="button"
              onClick={() => setBuyerType('first-home')}
              className={`p-3 border text-sm font-medium transition-all ${
                buyerType === 'first-home' 
                  ? 'border-accent bg-accent text-white' 
                  : 'border-border hover:border-primary/50'
              }`}
            >
              First Home Buyer
            </button>
            <button
              type="button"
              onClick={() => setBuyerType('foreign')}
              className={`p-3 border text-sm font-medium transition-all ${
                buyerType === 'foreign' 
                  ? 'border-accent bg-accent text-white' 
                  : 'border-border hover:border-primary/50'
              }`}
            >
              Foreign Purchaser
            </button>
          </div>
        </div>

        {/* Off the Plan */}
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="offPlan"
            checked={isOffPlan}
            onChange={(e) => setIsOffPlan(e.target.checked)}
            className="w-5 h-5 rounded border-border text-accent focus:ring-accent"
          />
          <label htmlFor="offPlan" className="text-sm text-primary cursor-pointer">
            This is an off-the-plan purchase
          </label>
        </div>

        <Button
          onClick={calculate}
          className="w-full rounded-none bg-accent hover:bg-accent/90 text-white py-6 font-heading font-bold uppercase tracking-wider"
        >
          Calculate Stamp Duty
        </Button>

        {result && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="border-t pt-6 space-y-6"
          >
            <h4 className="text-lg font-heading font-bold text-primary">Results</h4>
            
            <div className="bg-primary p-6 text-white">
              <div className="flex items-center gap-2 mb-2">
                <Percent size={16} className="text-accent" />
                <span className="text-sm text-white/70 uppercase tracking-wider">Total Government Costs</span>
              </div>
              <p className="text-4xl font-heading font-bold">{formatCurrency(result.totalCosts)}</p>
            </div>

            <div className="bg-secondary/30 p-6 space-y-3">
              <h5 className="font-bold text-primary text-sm uppercase tracking-wider">Breakdown</h5>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Base Stamp Duty</span>
                  <span className="font-medium text-primary">{formatCurrency(result.stampDuty)}</span>
                </div>
                {result.concession > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>First Home Buyer Concession</span>
                    <span className="font-medium">-{formatCurrency(result.concession)}</span>
                  </div>
                )}
                {result.foreignSurcharge > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Foreign Purchaser Surcharge (8%)</span>
                    <span className="font-medium">+{formatCurrency(result.foreignSurcharge)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t pt-2">
                  <span className="font-medium text-primary">Stamp Duty Payable</span>
                  <span className="font-bold text-accent">{formatCurrency(result.finalStampDuty)}</span>
                </div>
                <div className="flex justify-between pt-2">
                  <span className="text-muted-foreground">Transfer Fee</span>
                  <span className="font-medium text-primary">{formatCurrency(result.transferFee)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mortgage Registration</span>
                  <span className="font-medium text-primary">{formatCurrency(result.mortgageRegistration)}</span>
                </div>
              </div>
            </div>

            {buyerType === 'first-home' && propertyType === 'principal' && (
              <div className="bg-green-50 border border-green-200 p-4 text-sm text-green-800">
                <p className="font-medium">First Home Buyer Benefits Applied</p>
                <p className="text-green-600 mt-1">
                  {parseFloat(propertyValue.replace(/,/g, '')) <= 600000
                    ? 'Full stamp duty exemption applied for properties up to $600,000.'
                    : parseFloat(propertyValue.replace(/,/g, '')) <= 750000
                    ? 'Partial concession applied for properties between $600,001 and $750,000.'
                    : 'Property value exceeds First Home Buyer concession threshold of $750,000.'}
                </p>
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              * Calculations are based on current Victorian State Revenue Office rates. This is an estimate only. 
              Please consult with your conveyancer for exact figures.
            </p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
