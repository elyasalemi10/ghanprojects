import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calculator, RotateCcw, Plus, Trash2, TrendingUp, DollarSign, Percent } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ValueUpliftYear {
  year: string;
  newBaseRent: string;
  rentalIncrease: string;
}

interface CalculationResult {
  totalCashRequired: number;
  grossYield: number;
  netYield: number;
  yearlyIncome: number[];
  loanRepayments: number;
  totalPurchaseCosts: number;
  deposit: number;
}

export function RentalYieldCalculator() {
  const [purchasePrice, setPurchasePrice] = useState<string>('');
  const [year1RentalIncome, setYear1RentalIncome] = useState<string>('');
  const [lvrPercent, setLvrPercent] = useState<string>('65');
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
  const [valueUpliftYears, setValueUpliftYears] = useState<ValueUpliftYear[]>([
    { year: '', newBaseRent: '', rentalIncrease: '' }
  ]);
  const [result, setResult] = useState<CalculationResult | null>(null);

  const price = parseFloat(purchasePrice.replace(/,/g, '')) || 0;
  const lvr = Math.min(100, Math.max(5, parseFloat(lvrPercent) || 65)) / 100;
  const totalLoan = price * lvr;
  const deposit = price - totalLoan;

  useEffect(() => {
    if (price > 0) {
      const calculatedStampDuty = calculateVictorianStampDuty(price);
      setStampDuty(Math.round(calculatedStampDuty).toString());
    }
  }, [price]);

  useEffect(() => {
    if (price > 0 && year1RentalIncome) {
      calculate();
    }
  }, [price, year1RentalIncome, lvrPercent, stampDuty, valuationCost, solicitorCost, otherCosts, rentalIncrease, termOfOwnership, loanInterest]);

  const calculateVictorianStampDuty = (value: number): number => {
    if (value <= 25000) return value * 0.014;
    if (value <= 130000) return 350 + (value - 25000) * 0.024;
    if (value <= 960000) return 2870 + (value - 130000) * 0.06;
    if (value <= 2000000) return 52670 + (value - 960000) * 0.055;
    return 109870 + (value - 2000000) * 0.065;
  };

  const handleNumberInput = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    const value = e.target.value.replace(/[^0-9.]/g, '');
    setter(value);
  };

  const calculate = () => {
    if (price <= 0) return;

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
    const grossYield = rental > 0 ? (rental / price) * 100 : 0;
    const netYield = rental > 0 ? ((rental - annualLoanRepayments) / price) * 100 : 0;

    setResult({
      totalCashRequired,
      grossYield,
      netYield,
      yearlyIncome,
      loanRepayments: annualLoanRepayments,
      totalPurchaseCosts,
      deposit
    });
  };

  const addUpliftYear = () => {
    setValueUpliftYears([...valueUpliftYears, { year: '', newBaseRent: '', rentalIncrease: '' }]);
  };

  const removeUpliftYear = (index: number) => {
    if (valueUpliftYears.length > 1) {
      setValueUpliftYears(valueUpliftYears.filter((_, i) => i !== index));
    }
  };

  const updateUpliftYear = (index: number, field: keyof ValueUpliftYear, value: string) => {
    const updated = [...valueUpliftYears];
    updated[index][field] = value;
    setValueUpliftYears(updated);
  };

  const clearForm = () => {
    setPurchasePrice('');
    setYear1RentalIncome('');
    setLvrPercent('65');
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
    setValueUpliftYears([{ year: '', newBaseRent: '', rentalIncrease: '' }]);
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
      className="bg-white rounded-xl shadow-xl overflow-hidden"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 p-6 sm:p-8 text-white">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
            <Calculator size={28} />
          </div>
          <div>
            <h3 className="text-2xl sm:text-3xl font-heading font-bold">Rental Yield Calculator</h3>
            <p className="text-white/70 text-sm mt-1">Calculate your investment property forecast</p>
          </div>
        </div>
      </div>

      <div className="p-6 sm:p-8">
        {/* Main Inputs Grid */}
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Left Column - Purchase Details */}
          <div className="space-y-6">
            <h4 className="text-sm font-bold text-primary uppercase tracking-wider flex items-center gap-2">
              <DollarSign size={16} className="text-accent" />
              Purchase Details
            </h4>
            
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Purchase Price</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">$</span>
                  <input
                    type="text"
                    value={purchasePrice ? parseInt(purchasePrice).toLocaleString() : ''}
                    onChange={(e) => handleCurrencyInput(e.target.value, setPurchasePrice)}
                    placeholder="750,000"
                    className="w-full border border-gray-200 rounded-lg pl-8 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Loan to Value Ratio (%)</label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="5"
                    max="100"
                    value={lvrPercent}
                    onChange={(e) => setLvrPercent(e.target.value)}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-accent"
                  />
                  <div className="w-20">
                    <input
                      type="text"
                      value={lvrPercent}
                      onChange={(e) => handleNumberInput(e, setLvrPercent)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-center font-medium focus:outline-none focus:ring-2 focus:ring-accent/50"
                    />
                  </div>
                </div>
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>Loan: {formatCurrency(totalLoan)}</span>
                  <span>Deposit: {formatCurrency(deposit)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Stamp Duty</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                    <input
                      type="text"
                      value={stampDuty ? parseInt(stampDuty).toLocaleString() : ''}
                      onChange={(e) => handleCurrencyInput(e.target.value, setStampDuty)}
                      placeholder="Auto"
                      className="w-full border border-gray-200 rounded-lg pl-7 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Loan Interest %</label>
                  <input
                    type="text"
                    value={loanInterest}
                    onChange={(e) => handleNumberInput(e, setLoanInterest)}
                    placeholder="6.5"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Valuation</label>
                  <input
                    type="text"
                    value={valuationCost ? parseInt(valuationCost).toLocaleString() : ''}
                    onChange={(e) => handleCurrencyInput(e.target.value, setValuationCost)}
                    placeholder="$0"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Solicitor</label>
                  <input
                    type="text"
                    value={solicitorCost ? parseInt(solicitorCost).toLocaleString() : ''}
                    onChange={(e) => handleCurrencyInput(e.target.value, setSolicitorCost)}
                    placeholder="$0"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Other Costs</label>
                  <input
                    type="text"
                    value={otherCosts ? parseInt(otherCosts).toLocaleString() : ''}
                    onChange={(e) => handleCurrencyInput(e.target.value, setOtherCosts)}
                    placeholder="$0"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Income Details */}
          <div className="space-y-6">
            <h4 className="text-sm font-bold text-primary uppercase tracking-wider flex items-center gap-2">
              <TrendingUp size={16} className="text-accent" />
              Income Details
            </h4>
            
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Year 1 Net Rental Income (Annual)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">$</span>
                  <input
                    type="text"
                    value={year1RentalIncome ? parseInt(year1RentalIncome).toLocaleString() : ''}
                    onChange={(e) => handleCurrencyInput(e.target.value, setYear1RentalIncome)}
                    placeholder="28,600"
                    className="w-full border border-gray-200 rounded-lg pl-8 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Rental Increase %</label>
                  <input
                    type="text"
                    value={rentalIncrease}
                    onChange={(e) => handleNumberInput(e, setRentalIncrease)}
                    placeholder="3"
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-accent/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Term (Years)</label>
                  <input
                    type="text"
                    value={termOfOwnership}
                    onChange={(e) => handleNumberInput(e, setTermOfOwnership)}
                    placeholder="10"
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-accent/50"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <input
                  type="checkbox"
                  id="debtReduction"
                  checked={debtReduction}
                  onChange={(e) => setDebtReduction(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-accent focus:ring-accent"
                />
                <label htmlFor="debtReduction" className="text-sm text-gray-700 cursor-pointer flex-1">
                  Apply Debt Reduction
                </label>
                {debtReduction && (
                  <input
                    type="text"
                    value={debtReductionPercent}
                    onChange={(e) => handleNumberInput(e, setDebtReductionPercent)}
                    placeholder="%"
                    className="w-16 border border-gray-200 rounded px-2 py-1 text-sm text-center"
                  />
                )}
              </div>

              {/* Total Cash Required Card */}
              <div className="bg-gradient-to-br from-accent to-accent/80 rounded-xl p-5 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/70 text-sm font-medium">Total Cash Required</p>
                    <p className="text-3xl font-heading font-bold mt-1">
                      {result ? formatCurrency(result.totalCashRequired) : '—'}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <DollarSign size={24} />
                  </div>
                </div>
                {result && (
                  <div className="mt-3 pt-3 border-t border-white/20 flex justify-between text-sm">
                    <span className="text-white/70">Deposit: {formatCurrency(result.deposit)}</span>
                    <span className="text-white/70">Costs: {formatCurrency(result.totalPurchaseCosts)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Value Uplift Section */}
        <div className="mt-8 pt-6 border-t">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="valueUplift"
              checked={valueUplift}
              onChange={(e) => setValueUplift(e.target.checked)}
              className="w-5 h-5 rounded border-gray-300 text-accent focus:ring-accent"
            />
            <label htmlFor="valueUplift" className="text-sm font-medium text-gray-700 cursor-pointer">
              Is there a value uplift? <span className="text-accent text-xs font-normal">(New)</span>
            </label>
          </div>

          {valueUplift && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-4 space-y-3"
            >
              {valueUpliftYears.map((uplift, index) => (
                <div key={index} className="grid grid-cols-12 gap-3 items-end">
                  <div className="col-span-3">
                    {index === 0 && <label className="block text-xs font-medium text-gray-600 mb-1.5">Year</label>}
                    <input
                      type="text"
                      value={uplift.year}
                      onChange={(e) => updateUpliftYear(index, 'year', e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="Year"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                    />
                  </div>
                  <div className="col-span-4">
                    {index === 0 && <label className="block text-xs font-medium text-gray-600 mb-1.5">New Base Rent</label>}
                    <input
                      type="text"
                      value={uplift.newBaseRent ? parseInt(uplift.newBaseRent).toLocaleString() : ''}
                      onChange={(e) => updateUpliftYear(index, 'newBaseRent', e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="$0"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                    />
                  </div>
                  <div className="col-span-4">
                    {index === 0 && <label className="block text-xs font-medium text-gray-600 mb-1.5">Rental % Increase</label>}
                    <input
                      type="text"
                      value={uplift.rentalIncrease}
                      onChange={(e) => updateUpliftYear(index, 'rentalIncrease', e.target.value.replace(/[^0-9.]/g, ''))}
                      placeholder="%"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                    />
                  </div>
                  <div className="col-span-1 flex justify-center">
                    {valueUpliftYears.length > 1 && (
                      <button
                        onClick={() => removeUpliftYear(index)}
                        className="p-2 text-red-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              <button
                onClick={addUpliftYear}
                className="flex items-center gap-2 text-sm text-accent hover:text-accent/80 font-medium transition-colors"
              >
                <Plus size={16} />
                Add another year
              </button>
            </motion.div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mt-8">
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
            Clear Form
          </Button>
        </div>

        {/* Results */}
        {result && result.grossYield > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 pt-8 border-t space-y-6"
          >
            <h4 className="text-lg font-heading font-bold text-primary flex items-center gap-2">
              <Percent size={20} className="text-accent" />
              Investment Analysis
            </h4>
            
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bg-primary rounded-xl p-6 text-white">
                <span className="text-sm text-white/70 uppercase tracking-wider">Gross Yield</span>
                <p className="text-4xl font-heading font-bold mt-2">{result.grossYield.toFixed(2)}%</p>
              </div>
              <div className="bg-gradient-to-br from-accent to-accent/80 rounded-xl p-6 text-white">
                <span className="text-sm text-white/80 uppercase tracking-wider">Net Yield</span>
                <p className="text-4xl font-heading font-bold mt-2">{result.netYield.toFixed(2)}%</p>
              </div>
            </div>

            {result.yearlyIncome.length > 0 && (
              <div className="bg-gray-50 rounded-xl p-6">
                <h5 className="font-bold text-primary text-sm uppercase tracking-wider mb-4">Projected Annual Income</h5>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {result.yearlyIncome.slice(0, 10).map((income, i) => (
                    <div key={i} className="bg-white rounded-lg p-3 text-center shadow-sm">
                      <span className="text-xs text-gray-400 block">Year {i + 1}</span>
                      <span className="font-bold text-primary text-sm">{formatCurrency(income)}</span>
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
