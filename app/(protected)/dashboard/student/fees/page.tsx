'use client';

import { Card } from '@/src/components/ui/Card';
import { DollarSign } from 'lucide-react';

export default function FeesPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800"><DollarSign /> Fees</h1>
      <Card>
        <p className="text-gray-600">Your fees and payment information will be displayed here.</p>
      </Card>
    </div>
  );
}
