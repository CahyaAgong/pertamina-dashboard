import React from 'react';
import { Info } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import balanceData from '../JSON/HasilEkstraksi.json'; // Importing the new JSON data
import analysisKoran from '../JSON/AnalisaRekeningKoran.json'

// Utility function to safely parse a string and return a default value (0 if invalid)
const parseSafeFloat = (value) => {
  if (typeof value !== 'string' || value.trim() === '') {
    console.log('Returning 0 because value is invalid or empty:', value); // Debugging log
    return 0; // Return 0 if the value is not a valid string
  }
  // Try to remove non-numeric characters and parse the value
  const cleanedValue = value.replace(/[^0-9.-]+/g, "");

  // Log the cleaned value before parsing
  console.log('Cleaned value:', cleanedValue);

  const parsedValue = parseFloat(cleanedValue);

  // Log the parsed value to ensure it is correct
  // console.log('Parsed value:', parsedValue);

  return isNaN(parsedValue) ? 0 : parsedValue;
};

const AnalyticsDashboardBalance = () => {
  // Extract the static data from the JSON, trim spaces from the key names
  const totalDebit = parseSafeFloat(analysisKoran.find(item => item.Description && item.Description.trim() === "Total Mutasi Debit")?.["Value "]);
  const totalCredit = parseSafeFloat(analysisKoran.find(item => item.Description && item.Description.trim() === "Total Mutasi Kredit")?.["Value "]);
  
 
  // console.log(avgBalance,'Average Balance')
  const getBalanceStatistic = (description) => {
    // Log the balanceStats to check if the JSON is being parsed correctly
    console.log('Balance Stats:', analysisKoran);  // <-- Check the structure in the console
  
    // Search for the description in the balanceStats JSON array
    const stat = analysisKoran.find(item => item.Description && item.Description.trim() === description.trim());
    console.log(stat, 'statss')
    // Log the found stat for debugging
    console.log(`Found stat for ${description}:`, stat);
  
    // If the stat exists, parse the value, otherwise return 0
    return stat.Value
  };

  // Get the dynamic values from the JSON
  const avgBalance = getBalanceStatistic("Average Balance");
  const highestBalance = getBalanceStatistic("Highest Balance");
  const lowestBalance = getBalanceStatistic("Lowest Balance");
  // console.log(avgBalance,'averages')
  const formatCurrencyIDR = (value) => {
    if (!value || isNaN(value)) return '0.00'; // Ensure value is a valid number
    // Format the value as IDR (Indonesian Rupiah) with commas and two decimal places
    return parseFloat(value).toLocaleString('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).replace('IDR', '').trim(); // Remove the "IDR" prefix if you don't want it
  };

  // Process data for chart rendering
  const chartData = balanceData
    .sort((a, b) => new Date(a.date) - new Date(b.date))  // Sort by date ascending (earliest first)
    .reduce((acc, current) => {
      const balance = parseSafeFloat(current.balance);

      // Skip invalid balance entries
      if (balance === 0 && current.balance.trim() === '') {
        return acc;
      }

      // If the current date is the same as the previous one, update only the balance
      if (acc.length > 0 && acc[acc.length - 1].date === current.date) {
        acc[acc.length - 1] = {
          ...acc[acc.length - 1],
          balance: parseSafeFloat(current.balance),  // Update the balance with the latest value
          description: current.description,  // Update description to the latest one
        };
      } else {
        // Otherwise, add the new entry
        acc.push({
          date: current.date,
          balance: parseSafeFloat(current.balance),
          description: current.description,
        });
      }

      return acc;
    }, []);


  // Ensure valid data for the chart
  const isValidData = chartData.length > 0 && chartData.every(item => item.balance !== undefined);

  return (
    <>
      {/* Main Content */}
      <div className="flex-1 bg-gray-50">
        <div className="p-4 space-y-6">
          <Section
            title="Balance Trend"
            description="Account balance progression over the selected time frame"
            icon={<Info size={16} />}
          >
            {/* Only render chart if data is valid */}
            {isValidData ? (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip 
                      content={({ payload }) => {
                        if (payload && payload.length) {
                          const value = payload[0].value; // Get the balance value
                          return (
                            <div className="custom-tooltip">
                              <p>{`Date: ${payload[0].payload.date}`}</p>
                              <p>{`Balance: ${formatCurrencyIDR(value.toFixed(2))}`}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Line type="monotone" dataKey="balance" stroke="#2563eb" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p>No valid data available to display the chart.</p> // Fallback message if data is invalid
            )}
          </Section>

          <Section title="Balance Statistics" icon={<Info size={16} />}>
          <div className="grid grid-cols-4 gap-6">
            <SummaryCard
              title="Average Balance"
              value={formatCurrency(avgBalance.toFixed(2))}
            />
            <SummaryCard
              title="Highest Balance"
              value={formatCurrency(highestBalance.toFixed(2))}
              textColor="text-green-600"
            />
            <SummaryCard
              title="Lowest Balance"
              value={formatCurrency(lowestBalance.toFixed(2))}
              textColor="text-green-600"
            />
            {/* <SummaryCard
              title="Balance Growth"
              value={getBalanceGrowth(chartData)}
              textColor="text-green-600"
            /> */}
          </div>
        </Section>

        <Section title="Daily Balance" icon={<Info size={16} />}>
  <div className="overflow-x-auto">
    <table className="w-full text-xs">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-2 py-1 text-right">Date</th>
          <th className="px-2 py-1 text-left">Description</th>
          <th className="px-2 py-1 text-right">Opening Balance</th>
          <th className="px-2 py-1 text-right">Closing Balance</th>
        </tr>
      </thead>
      <tbody>
        {balanceData
          .filter(item => parseSafeFloat(item.balance) !== 0 && item.balance.trim() !== '')  // Filter out zero or empty balance entries
          .sort((a, b) => new Date(a.date) - new Date(b.date)) // Sort by date ascending
          .reduce((acc, item, index, arr) => {
            // If it's the last entry for a given date (most recent), add it to the accumulator
            if (!acc.some(accItem => accItem.date === item.date)) {
              acc.push(item);  // Add the item to accumulator (it's the last entry for this date)
            }
            return acc;
          }, []) // Reduce to unique dates with the latest balance data
          .map((item, index, arr) => {
            // Opening balance is the previous day's closing balance, or the current day's balance if it's the first day
            const openingBalance = index === 0 ? item.balance : arr[index - 1].balance;

            // Closing balance is the current day's balance
            const closingBalance = item.balance;

            // Format the balances for display
            const openingBalanceFormatted = formatCurrency(openingBalance);
            const closingBalanceFormatted = formatCurrency(closingBalance);

            return (
              <tr key={index} className="border-t">
                <td className="px-2 py-1 text-right">{item.date}</td>
                <td className="px-2 py-1">{item.description}</td>
                <td className="px-2 py-1 text-right">{openingBalanceFormatted}</td>
                <td className="px-2 py-1 text-right">{closingBalanceFormatted}</td>
              </tr>
            );
          })}
      </tbody>
    </table>
  </div>
</Section>

        </div>
      </div>
    </>
  );
};

// Utility function to format currency with a fallback value
const formatCurrency = (value) => {
  if (!value) return '0.00'; // Return '0.00' if value is undefined or null
  return value.replace(/(\d)(?=(\d{3})+\.)/g, '$1,');
};

// Utility function to calculate balance growth
// Utility function to calculate balance growth (Highest Balance - Lowest Balance)
const getBalanceGrowth = (data) => {
  if (data.length === 0) {
    return '0.00';  // Return 0 if no data is available
  }

  // Extract all balance values
  const balances = data.map(item => parseSafeFloat(item.balance));

  // Get the highest and lowest balances
  const highestBalance = Math.max(...balances);
  const lowestBalance = Math.min(...balances);

  // Calculate the balance growth as the difference
  const growth = highestBalance - lowestBalance;
  
  return `${growth.toFixed(2)}`;
};


const Section = ({ title, description, icon, children }) => (
  <div className="bg-white rounded-lg p-4 shadow-lg">
    <div className="flex items-center space-x-2 mb-2">
      <h2 className="text-lg font-medium">{title}</h2>
      {icon}
    </div>
    {description && <p className="text-sm text-gray-600 mb-4">{description}</p>}
    {children}
  </div>
);

const SummaryCard = ({ title, value, textColor = "text-gray-900" }) => (
  <div>
    <div className="text-sm text-gray-600 mb-1">{title}</div>
    <div className={`text-lg font-medium ${textColor}`}>{value}</div>
  </div>
);

export default AnalyticsDashboardBalance;
