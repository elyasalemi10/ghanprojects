import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calculator, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CalculationResult {
  totalCashRequired: number;
  grossYield: number;
  netYield: number;
  yearlyIncome: number[];
  loanRepayments: number;
  totalPurchaseCosts: number;
}

const LVR_OPTIONS = [
  { label: '65%', value: 0.65 },
  { label: '70%', value: 0.70 },
  { label: '75%', value: 0.75 },
  { label: '80%', value: 0.80 },
  { label: '85%', value: 0.85 },
  { label: '90%', value: 0.90 },
];

export function RentalYieldCalculator() {
  const [purchasePrice, setPurchasePrice] = useState<string>('');
  const [year1RentalIncome, setYear1RentalIncome] = useState<string>('');
  const [lvr, setLvr] = useState<number>(0.65);
  const [rentalIncrease, setRentalIncrease] = useState<string>('3');
  const [termOfOwnership, setTermOfOwnership] = useState<string>('10');
  const [stampDuty, setStampDuty] = useState<string>('');
  const [loanInterest, setLoanInterest] = useState<string>('6.5');
  const [valuationCost, setValuationCost] = useState<string>('');
  const [solicitorCost, setSolicitorCost] = useState<string>('');
  const [otherCosts, setOtherCosts] = useState<string>('');
  const [debtReduction, setDebtReduction] = useState<boolean>(false);
  const [debtReductionPercent, setDebtReductionPercent] = useState<string>('0');
  const [valueUplift, setValueUplift] = useState<boolean>(false);
  const [result, setResult] = useState<CalculationResult | null>(null);

  const price = parseFloat(purchasePrice.replace(/,/g, '')) || 0;
  const totalLoan = price * lvr;
  const deposit = price - totalLoan;

  useEffect(() => {
    if (price > 0) {
      const calculatedStampDuty = calculateVictorianStampDuty(price);
      setStampDuty(Math.round(calculatedStampDuty).toString());
    }
  }, [price]);

  const calculateVictorianStampDuty = (value: number): number => {
    if (value <= 25000) return value * 0.014;
    if (value <= 130000) return 350 + (value - 25000) * 0.024;
    if (value <= 960000) return 2870 + (value - 130000) * 0.06;
    if (value <= 2000000) return 52670 + (value - 960000) * 0.055;
    return 109870 + (value - 2000000) * 0.065;
  };

  const calculate = () => {
    if (price <= 0 || !year1RentalIncome) return;

    const rental = parseFloat(year1RentalIncome.replace(/,/g, '')) || 0;
    const increase = parseFloat(rentalIncrease) / 100 || 0;
    const term = parseInt(termOfOwnership) || 10;
    const interest = parseFloat(loanInterest) / 100 || 0.065;
    const stamp = parseFloat(stampDuty.replace(/,/g, '')) || 0;
    const valuation = parseFloat(valuationCost.replace(/,/g, '')) || 0;
    const solicitor = parseFloat(solicitorCost.replace(/,/g, '')) || 0;
    const other = parseFloat(otherCosts.replace(/,/g, '')) || 0;

    const totalPurchaseCosts = stamp + valuation + solicitor + other;
    const totalCashRequired = deposit + totalPurchaseCosts;

    const yearlyIncome: number[] = [];
    let currentRental = rental;
    for (let i = 0; i < term; i++) {
      yearlyIncome.push(currentRental);
      currentRental = currentRental * (1 + increase);
    }

    const annualLoanRepayments = totalLoan * interest;
    const grossYield = (rental / price) * 100;
    const netYield = ((rental - annualLoanRepayments) / price) * 100;

    setResult({
      totalCashRequired,
      grossYield,
      netYield,
      yearlyIncome,
      loanRepayments: annualLoanRepayments,
      totalPurchaseCosts
    });
  };

  const clearForm = () => {
    setPurchasePrice('');
    setYear1RentalIncome('');
    setLvr(0.65);
    setRentalIncrease('3');
    setTermOfOwnership('10');
    setStampDuty('');
    setLoanInterest('6.5');
    setValuationCost('');
    setSolicitorCost('');
    setOtherCosts('');
    setDebtReduction(false);
    setDebtReductionPercent('0');
    setValueUplift(false);
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

  const handleCurrencyInput = (value: string, setter: (val: string) => void) => {
    const cleaned = value.replace(/[^0-9]/g, '');
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
            <Calculator size={20} />
          </div>
          <h3 className="text-2xl font-heading font-bold text-primary uppercase tracking-wide">Rental Yield Calculator</h3>
        </div>
        <p className="text-muted-foreground text-sm">Fill the information below to calculate your forecast</p>
      </div>

      <div className="p-6 sm:p-8 space-y-6">
        <div className="grid md:grid-cols-2 gap-x-8 gap-y-6">
          {/* Left Column */}
          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-primary">Purchase Price</label>
              <input
                type="text"
                value={purchasePrice ? parseInt(purchasePrice).toLocaleString() : ''}
                onChange={(e) => handleCurrencyInput(e.target.value, setPurchasePrice)}
                placeholder="Enter purchase price"
                className="w-full bg-transparent border-b border-border px-0 py-2 focus:outline-none focus:border-accent transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-primary">Total Loan</label>
              <div className="relative">
                <select
                  value={lvr}
                  onChange={(e) => setLvr(parseFloat(e.target.value))}
                  className="w-full bg-transparent border-b border-border px-0 py-2 focus:outline-none focus:border-accent appearance-none cursor-pointer"
                >
                  {LVR_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {formatCurrency(totalLoan)} ({opt.label})
                    </option>
                  ))}
                </select>
                <span className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none">▼</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-primary">Deposit</label>
              <div className="w-full bg-secondary/30 border-b border-border px-0 py-2 text-muted-foreground">
                {price > 0 ? formatCurrency(deposit) : '—'}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-primary">Stamp Duty</label>
              <input
                type="text"
                value={stampDuty ? parseInt(stampDuty).toLocaleString() : ''}
                onChange={(e) => handleCurrencyInput(e.target.value, setStampDuty)}
                placeholder="Auto-calculated"
                className="w-full bg-transparent border-b border-border px-0 py-2 focus:outline-none focus:border-accent transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-primary">Valuation Cost</label>
              <input
                type="text"
                value={valuationCost ? parseInt(valuationCost).toLocaleString() : ''}
                onChange={(e) => handleCurrencyInput(e.target.value, setValuationCost)}
                placeholder="Enter valuation cost"
                className="w-full bg-transparent border-b border-border px-0 py-2 focus:outline-none focus:border-accent transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-primary">Solicitor Cost</label>
              <input
                type="text"
                value={solicitorCost ? parseInt(solicitorCost).toLocaleString() : ''}
                onChange={(e) => handleCurrencyInput(e.target.value, setSolicitorCost)}
                placeholder="Enter solicitor cost"
                className="w-full bg-transparent border-b border-border px-0 py-2 focus:outline-none focus:border-accent transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-primary">Other Purchasing Cost</label>
              <input
                type="text"
                value={otherCosts ? parseInt(otherCosts).toLocaleString() : ''}
                onChange={(e) => handleCurrencyInput(e.target.value, setOtherCosts)}
                placeholder="Enter other costs"
                className="w-full bg-transparent border-b border-border px-0 py-2 focus:outline-none focus:border-accent transition-colors"
              />
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-primary">Year 1 Net Rental Income</label>
              <input
                type="text"
                value={year1RentalIncome ? parseInt(year1RentalIncome).toLocaleString() : ''}
                onChange={(e) => handleCurrencyInput(e.target.value, setYear1RentalIncome)}
                placeholder="Enter annual rental income"
                className="w-full bg-transparent border-b border-border px-0 py-2 focus:outline-none focus:border-accent transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-primary">Rental Increase %</label>
              <input
                type="number"
                value={rentalIncrease}
                onChange={(e) => setRentalIncrease(e.target.value)}
                placeholder="3"
                step="0.5"
                className="w-full bg-transparent border-b border-border px-0 py-2 focus:outline-none focus:border-accent transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-primary">Term of ownership (years)</label>
              <input
                type="number"
                value={termOfOwnership}
                onChange={(e) => setTermOfOwnership(e.target.value)}
                placeholder="10"
                className="w-full bg-transparent border-b border-border px-0 py-2 focus:outline-none focus:border-accent transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-primary">Loan Interest %</label>
              <input
                type="number"
                value={loanInterest}
                onChange={(e) => setLoanInterest(e.target.value)}
                placeholder="6.5"
                step="0.1"
                className="w-full bg-transparent border-b border-border px-0 py-2 focus:outline-none focus:border-accent transition-colors"
              />
            </div>

            <div className="flex items-center gap-3 py-2">
              <input
                type="checkbox"
                id="debtReduction"
                checked={debtReduction}
                onChange={(e) => setDebtReduction(e.target.checked)}
                className="w-4 h-4 rounded border-border text-accent focus:ring-accent"
              />
              <label htmlFor="debtReduction" className="text-sm text-muted-foreground cursor-pointer">
                Debt Reduction
              </label>
            </div>

            {debtReduction && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-primary">% of profit used for debt reduction</label>
                <input
                  type="number"
                  value={debtReductionPercent}
                  onChange={(e) => setDebtReductionPercent(e.target.value)}
                  placeholder="0"
                  className="w-full bg-transparent border-b border-border px-0 py-2 focus:outline-none focus:border-accent transition-colors"
                />
              </div>
            )}

            <div className="space-y-2 pt-2">
              <label className="text-sm font-medium text-primary">Total cash required</label>
              <div className="w-full bg-primary text-white px-4 py-3 font-bold text-lg">
                {result ? formatCurrency(result.totalCashRequired) : '—'}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <input
            type="checkbox"
            id="valueUplift"
            checked={valueUplift}
            onChange={(e) => setValueUplift(e.target.checked)}
            className="w-4 h-4 rounded border-border text-accent focus:ring-accent"
          />
          <label htmlFor="valueUplift" className="text-sm text-primary cursor-pointer">
            Is there a value uplift? <span className="text-accent text-xs">(New)</span>
          </label>
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
            <h4 className="text-lg font-heading font-bold text-primary">Investment Analysis</h4>
            
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bg-primary p-6 text-white">
                <span className="text-sm text-white/70 uppercase tracking-wider">Gross Yield</span>
                <p className="text-3xl font-heading font-bold mt-1">{result.grossYield.toFixed(2)}%</p>
              </div>
              <div className="bg-accent p-6 text-white">
                <span className="text-sm text-white/80 uppercase tracking-wider">Net Yield</span>
                <p className="text-3xl font-heading font-bold mt-1">{result.netYield.toFixed(2)}%</p>
              </div>
            </div>

            <div className="bg-secondary/30 p-6 space-y-3">
              <h5 className="font-bold text-primary text-sm uppercase tracking-wider">Purchase Breakdown</h5>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Deposit Required</span>
                  <span className="font-medium text-primary">{formatCurrency(deposit)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Purchase Costs</span>
                  <span className="font-medium text-primary">{formatCurrency(result.totalPurchaseCosts)}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="font-medium text-primary">Total Cash Required</span>
                  <span className="font-bold text-accent">{formatCurrency(result.totalCashRequired)}</span>
                </div>
              </div>
            </div>

            {result.yearlyIncome.length > 0 && (
              <div className="bg-secondary/30 p-6 space-y-3">
                <h5 className="font-bold text-primary text-sm uppercase tracking-wider">Projected Rental Income</h5>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-sm">
                  {result.yearlyIncome.slice(0, 10).map((income, i) => (
                    <div key={i} className="bg-background p-3 text-center">
                      <span className="text-xs text-muted-foreground block">Year {i + 1}</span>
                      <span className="font-medium text-primary">{formatCurrency(income)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
