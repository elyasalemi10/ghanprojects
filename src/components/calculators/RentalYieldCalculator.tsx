import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calculator, DollarSign, Percent, TrendingUp, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CalculationResult {
  grossYield: number;
  netYield: number;
  annualRent: number;
  annualExpenses: number;
  netIncome: number;
}

export function RentalYieldCalculator() {
  const [propertyValue, setPropertyValue] = useState<string>('');
  const [weeklyRent, setWeeklyRent] = useState<string>('');
  const [managementFee, setManagementFee] = useState<string>('8');
  const [councilRates, setCouncilRates] = useState<string>('');
  const [insurance, setInsurance] = useState<string>('');
  const [maintenance, setMaintenance] = useState<string>('');
  const [vacancyRate, setVacancyRate] = useState<string>('2');
  const [result, setResult] = useState<CalculationResult | null>(null);

  const calculateYield = () => {
    const value = parseFloat(propertyValue.replace(/,/g, '')) || 0;
    const rent = parseFloat(weeklyRent.replace(/,/g, '')) || 0;
    const mgmtFee = parseFloat(managementFee) || 0;
    const rates = parseFloat(councilRates.replace(/,/g, '')) || 0;
    const ins = parseFloat(insurance.replace(/,/g, '')) || 0;
    const maint = parseFloat(maintenance.replace(/,/g, '')) || 0;
    const vacancy = parseFloat(vacancyRate) || 0;

    if (value <= 0 || rent <= 0) return;

    const annualRent = rent * 52;
    const vacancyLoss = annualRent * (vacancy / 100);
    const effectiveRent = annualRent - vacancyLoss;
    const managementCost = effectiveRent * (mgmtFee / 100);
    const annualExpenses = managementCost + rates + ins + maint;
    const netIncome = effectiveRent - annualExpenses;

    const grossYield = (annualRent / value) * 100;
    const netYield = (netIncome / value) * 100;

    setResult({
      grossYield,
      netYield,
      annualRent,
      annualExpenses,
      netIncome
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
          <h3 className="text-2xl font-heading font-bold text-primary">Rental Yield Calculator</h3>
        </div>
        <p className="text-muted-foreground text-sm">Calculate gross and net rental yields for your investment property.</p>
      </div>

      <div className="p-6 sm:p-8 space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Property Value */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-primary flex items-center gap-2">
              <DollarSign size={14} className="text-accent" />
              Property Value
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <input
                type="text"
                value={propertyValue ? parseInt(propertyValue).toLocaleString() : ''}
                onChange={(e) => handleCurrencyInput(e.target.value, setPropertyValue)}
                placeholder="750,000"
                className="w-full bg-secondary/30 border border-border pl-8 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>

          {/* Weekly Rent */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-primary flex items-center gap-2">
              <DollarSign size={14} className="text-accent" />
              Weekly Rent
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <input
                type="text"
                value={weeklyRent ? parseInt(weeklyRent).toLocaleString() : ''}
                onChange={(e) => handleCurrencyInput(e.target.value, setWeeklyRent)}
                placeholder="550"
                className="w-full bg-secondary/30 border border-border pl-8 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>
        </div>

        <div className="border-t pt-6">
          <h4 className="text-sm font-bold text-primary uppercase tracking-wider mb-4 flex items-center gap-2">
            <Info size={14} className="text-accent" />
            Expenses (Optional - for Net Yield)
          </h4>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Management Fee (%)</label>
              <input
                type="number"
                value={managementFee}
                onChange={(e) => setManagementFee(e.target.value)}
                placeholder="8"
                className="w-full bg-secondary/30 border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Council Rates (p.a.)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                <input
                  type="text"
                  value={councilRates ? parseInt(councilRates).toLocaleString() : ''}
                  onChange={(e) => handleCurrencyInput(e.target.value, setCouncilRates)}
                  placeholder="2,000"
                  className="w-full bg-secondary/30 border border-border pl-7 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Insurance (p.a.)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                <input
                  type="text"
                  value={insurance ? parseInt(insurance).toLocaleString() : ''}
                  onChange={(e) => handleCurrencyInput(e.target.value, setInsurance)}
                  placeholder="1,500"
                  className="w-full bg-secondary/30 border border-border pl-7 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Maintenance (p.a.)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                <input
                  type="text"
                  value={maintenance ? parseInt(maintenance).toLocaleString() : ''}
                  onChange={(e) => handleCurrencyInput(e.target.value, setMaintenance)}
                  placeholder="2,000"
                  className="w-full bg-secondary/30 border border-border pl-7 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            </div>
          </div>
          <div className="mt-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Vacancy Rate (%)</label>
              <input
                type="number"
                value={vacancyRate}
                onChange={(e) => setVacancyRate(e.target.value)}
                placeholder="2"
                className="w-32 bg-secondary/30 border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>
        </div>

        <Button
          onClick={calculateYield}
          className="w-full rounded-none bg-accent hover:bg-accent/90 text-white py-6 font-heading font-bold uppercase tracking-wider"
        >
          Calculate Yield
        </Button>

        {result && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="border-t pt-6 space-y-6"
          >
            <h4 className="text-lg font-heading font-bold text-primary">Results</h4>
            
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bg-primary p-6 text-white">
                <div className="flex items-center gap-2 mb-2">
                  <Percent size={16} className="text-accent" />
                  <span className="text-sm text-white/70 uppercase tracking-wider">Gross Yield</span>
                </div>
                <p className="text-4xl font-heading font-bold">{result.grossYield.toFixed(2)}%</p>
              </div>
              <div className="bg-accent p-6 text-white">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp size={16} />
                  <span className="text-sm text-white/80 uppercase tracking-wider">Net Yield</span>
                </div>
                <p className="text-4xl font-heading font-bold">{result.netYield.toFixed(2)}%</p>
              </div>
            </div>

            <div className="bg-secondary/30 p-6 space-y-3">
              <h5 className="font-bold text-primary text-sm uppercase tracking-wider">Breakdown</h5>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Annual Rental Income</span>
                  <span className="font-medium text-primary">{formatCurrency(result.annualRent)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Annual Expenses</span>
                  <span className="font-medium text-red-600">-{formatCurrency(result.annualExpenses)}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="font-medium text-primary">Net Annual Income</span>
                  <span className="font-bold text-accent">{formatCurrency(result.netIncome)}</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
