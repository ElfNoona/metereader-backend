/**
 * Tariff Calculator Utility
 * Generates all billing metrics (fixed charges, energy charges, taxes, and total).
 * Prices are based on IGL (Indraprastha Gas Limited) sample data.
 */

const calculateTariff = (previousReading, currentReading, billingCycleStart, billingCycleEnd) => {
  // Ensure non-negative consumption
  const unitsConsumed = Math.max(0, currentReading - previousReading);
  
  // Pricing Constants
  const RATE_PER_SCM = 49.59; // From invoice generator
  const FIXED_CHARGE_PER_DAY = 1.5; // Example Rs 1.5 per day for fixed network charge
  const TAX_RATE = 0.05; // Example 5% VAT / Duty
  
  // 1. Calculate Days in Billing Cycle
  const diffTime = Math.abs(new Date(billingCycleEnd) - new Date(billingCycleStart));
  const billingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 30; // Default to 30 days if same date
  
  // 2. Fixed Charges Calculation
  const fixedCharges = billingDays * FIXED_CHARGE_PER_DAY;
  
  // 3. Energy Charges Calculation
  const energyCharges = unitsConsumed * RATE_PER_SCM;
  
  // 4. Tax Calculation
  const subtotal = fixedCharges + energyCharges;
  const taxAmount = subtotal * TAX_RATE;
  
  // 5. Total Payable (Rounded to nearest 2 decimals)
  const totalPayable = subtotal + taxAmount;
  
  return {
    unitsConsumed,
    fixedCharges: Number(fixedCharges.toFixed(2)),
    energyCharges: Number(energyCharges.toFixed(2)),
    taxAmount: Number(taxAmount.toFixed(2)),
    totalPayable: Number(totalPayable.toFixed(2)) 
  };
};

module.exports = { calculateTariff };
