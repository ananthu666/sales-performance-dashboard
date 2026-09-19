import type { SalesRecord } from '../types/sales';

/**
 * Realistic wholesale sales sample dataset representing multiple salespeople
 * across Q1 (January, February, March).
 */
export const SAMPLE_SALES_RECORDS: SalesRecord[] = [
  // Ahmed Hassan
  { salesperson: 'Ahmed Hassan', month: 'January', budget: 120000, actual: 132500 },
  { salesperson: 'Ahmed Hassan', month: 'February', budget: 125000, actual: 141000 },
  { salesperson: 'Ahmed Hassan', month: 'March', budget: 130000, actual: 127500 },

  // Sara Ali
  { salesperson: 'Sara Ali', month: 'January', budget: 150000, actual: 138000 },
  { salesperson: 'Sara Ali', month: 'February', budget: 145000, actual: 151000 },
  { salesperson: 'Sara Ali', month: 'March', budget: 155000, actual: 142500 },

  // Mohammed Salem
  { salesperson: 'Mohammed Salem', month: 'January', budget: 100000, actual: 112000 },
  { salesperson: 'Mohammed Salem', month: 'February', budget: 105000, actual: 98000 },
  { salesperson: 'Mohammed Salem', month: 'March', budget: 110000, actual: 119500 },

  // Fatima Noor
  { salesperson: 'Fatima Noor', month: 'January', budget: 175000, actual: 161500 },
  { salesperson: 'Fatima Noor', month: 'February', budget: 180000, actual: 189000 },
  { salesperson: 'Fatima Noor', month: 'March', budget: 185000, actual: 201000 },

  // Omar Khalid
  { salesperson: 'Omar Khalid', month: 'January', budget: 90000, actual: 85500 },
  { salesperson: 'Omar Khalid', month: 'February', budget: 95000, actual: 102000 },
  { salesperson: 'Omar Khalid', month: 'March', budget: 100000, actual: 97000 },
];
