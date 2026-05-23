'use client';

import { useEffect, useState } from 'react';

interface CustomerItem {
  customer: {
    name: string;
    mobile: string;
    stb_number: string;
    area: string;
  };
  rechargeCount: number;
  lastRecharge: string | null;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCustomers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const fetchCustomers = async () => {
    try {
      const url = search
        ? `/api/admin/customers?search=${encodeURIComponent(search)}`
        : '/api/admin/customers';
      const response = await fetch(url);
      const data = await response.json();
      setCustomers(data.customers || []);
    } catch (error) {
      console.error('Failed to fetch customers:', error);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-brand-navy mb-8">
        Customers
      </h1>

      <div className="card">
        <div className="mb-6">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, mobile, STB number, or area..."
            className="input-field"
          />
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-accent-red"></div>
          </div>
        ) : customers.length === 0 ? (
          <p className="text-gray-600 text-center py-8">No customers found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Name</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Mobile</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">STB Number</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Area</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Recharges</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Last Plan</th>
                </tr>
              </thead>
              <tbody>
                {customers.map(({ customer, rechargeCount, lastRecharge }) => (
                  <tr key={customer.mobile} className="border-b last:border-b-0">
                    <td className="py-3 px-4 font-medium">{customer.name}</td>
                    <td className="py-3 px-4 text-gray-600">{customer.mobile}</td>
                    <td className="py-3 px-4 text-gray-600">{customer.stb_number}</td>
                    <td className="py-3 px-4 text-gray-600">{customer.area}</td>
                    <td className="py-3 px-4">
                      <span className="bg-accent-blue bg-opacity-10 text-accent-blue px-3 py-1 rounded-full text-sm font-medium">
                        {rechargeCount}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {lastRecharge || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
