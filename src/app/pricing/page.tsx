'use client';

import React from 'react';
import Link from 'next/link';

const Pricing = () => {
    return (
        <div className="min-h-screen bg-gray-50">
            <div className="container mx-auto px-4 py-12">
                <h1 className="text-4xl font-bold text-center mb-8">Pricing</h1>
                <p className="text-xl text-center text-gray-600 mb-12">
                    Affordable Furnished Medical Office Space for Rent—perfect for Healthcare Providers Looking for Ready-to-Use, Professional Workspaces with Flexible Terms.
                </p>

                {/* Pricing Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                    {/* Weekdays Card */}
                    <div className="bg-white rounded-lg shadow-lg p-6">
                        <h2 className="text-2xl font-bold text-center mb-4">Weekdays</h2>
                        <p className="text-3xl font-bold text-center text-blue-600 mb-4">$30/Hour</p>
                        <Link href="/booking" className="block w-full bg-blue-600 text-white text-center py-2 rounded hover:bg-blue-700">
                            Book Now
                        </Link>
                    </div>

                    {/* Weekends Card */}
                    <div className="bg-white rounded-lg shadow-lg p-6">
                        <h2 className="text-2xl font-bold text-center mb-4">Weekends</h2>
                        <p className="text-3xl font-bold text-center text-blue-600 mb-4">$20/Hour</p>
                        <Link href="/booking" className="block w-full bg-blue-600 text-white text-center py-2 rounded hover:bg-blue-700">
                            Book Now
                        </Link>
                    </div>

                    {/* Full-Time Card */}
                    <div className="bg-white rounded-lg shadow-lg p-6">
                        <h2 className="text-2xl font-bold text-center mb-4">Full-Time</h2>
                        <p className="text-3xl font-bold text-center text-blue-600 mb-4">$2,000/Month</p>
                        <Link href="/booking" className="block w-full bg-blue-600 text-white text-center py-2 rounded hover:bg-blue-700">
                            Book Now
                        </Link>
                    </div>
                </div>

                {/* Weekly Packages */}
                <div className="bg-white rounded-lg shadow-lg p-8 mb-12">
                    <h2 className="text-2xl font-bold text-center mb-8">Discounted Weekly Pricing Packages</h2>
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead>
                                <tr className="bg-gray-100">
                                    <th className="px-6 py-3 text-left">1 Day Per Week</th>
                                    <th className="px-6 py-3 text-left">2 Days Per Week</th>
                                    <th className="px-6 py-3 text-left">3 Days Per Week</th>
                                    <th className="px-6 py-3 text-left">4 Days Per Week</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td className="px-6 py-4">$200</td>
                                    <td className="px-6 py-4">$400</td>
                                    <td className="px-6 py-4">$500</td>
                                    <td className="px-6 py-4">$650</td>
                                </tr>
                                <tr>
                                    <td className="px-6 py-4">$300</td>
                                    <td className="px-6 py-4">$500</td>
                                    <td className="px-6 py-4">$600</td>
                                    <td className="px-6 py-4">$800</td>
                                </tr>
                                <tr>
                                    <td className="px-6 py-4">$400</td>
                                    <td className="px-6 py-4">$600</td>
                                    <td className="px-6 py-4">$700</td>
                                    <td className="px-6 py-4">$900</td>
                                </tr>
                                <tr>
                                    <td className="px-6 py-4">$500</td>
                                    <td className="px-6 py-4">$650</td>
                                    <td className="px-6 py-4">$850</td>
                                    <td className="px-6 py-4">$1,250</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Cost Savings Comparison */}
                <div className="bg-white rounded-lg shadow-lg p-8">
                    <h2 className="text-2xl font-bold text-center mb-8">TexasMed Cost Savings Comparison</h2>
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead>
                                <tr className="bg-gray-100">
                                    <th className="px-6 py-3 text-left">Leasing</th>
                                    <th className="px-6 py-3 text-left">TexasMed</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td className="px-6 py-4">Lease Term</td>
                                    <td className="px-6 py-4 font-bold">Daily</td>
                                </tr>
                                <tr>
                                    <td className="px-6 py-4">Initial Build-Out Costs</td>
                                    <td className="px-6 py-4 font-bold">None</td>
                                </tr>
                                <tr>
                                    <td className="px-6 py-4">Rent</td>
                                    <td className="px-6 py-4 font-bold">Flexible</td>
                                </tr>
                                <tr>
                                    <td className="px-6 py-4">Insurance/Maintenance/Taxes (NNN)</td>
                                    <td className="px-6 py-4 font-bold">Included</td>
                                </tr>
                                <tr>
                                    <td className="px-6 py-4">Janitorial Services</td>
                                    <td className="px-6 py-4 font-bold">Included</td>
                                </tr>
                                <tr>
                                    <td className="px-6 py-4">Medical Supplies</td>
                                    <td className="px-6 py-4 font-bold">Included</td>
                                </tr>
                                <tr>
                                    <td className="px-6 py-4">Phone/Internet/Cable</td>
                                    <td className="px-6 py-4 font-bold">Included</td>
                                </tr>
                                <tr>
                                    <td className="px-6 py-4">Electric/Water/Gas</td>
                                    <td className="px-6 py-4 font-bold">Included</td>
                                </tr>
                                <tr>
                                    <td className="px-6 py-4">Interior Maintenance/HVAC Service</td>
                                    <td className="px-6 py-4 font-bold">Included</td>
                                </tr>
                                <tr>
                                    <td className="px-6 py-4">Office Supplies/Printing</td>
                                    <td className="px-6 py-4 font-bold">Included</td>
                                </tr>
                                <tr>
                                    <td className="px-6 py-4">Bio-Hazard Waste Pick-Up</td>
                                    <td className="px-6 py-4 font-bold">Included</td>
                                </tr>
                                <tr>
                                    <td className="px-6 py-4">Tenant Insurance</td>
                                    <td className="px-6 py-4 font-bold">Included</td>
                                </tr>
                                <tr>
                                    <td className="px-6 py-4">On-Site Receptionist</td>
                                    <td className="px-6 py-4 font-bold">Included</td>
                                </tr>
                                <tr>
                                    <td className="px-6 py-4 font-bold">Total Monthly Costs</td>
                                    <td className="px-6 py-4 font-bold text-blue-600">TexasMed</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Pricing; 