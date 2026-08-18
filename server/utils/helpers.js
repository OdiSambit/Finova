function formatCurrency(amount) {
  const num = parseFloat(amount);
  if (isNaN(num)) return '₹0';

  const isNegative = num < 0;
  const absNum = Math.abs(num);
  const parts = absNum.toFixed(2).split('.');
  let intPart = parts[0];
  const decPart = parts[1];

  let result = '';
  let count = 0;
  for (let i = intPart.length - 1; i >= 0; i--) {
    result = intPart[i] + result;
    count++;
    if (count === 3 && i !== 0) {
      result = ',' + result;
    } else if (count > 3 && (count - 3) % 2 === 0 && i !== 0) {
      result = ',' + result;
    }
  }

  if (decPart && decPart !== '00') {
    result = result + '.' + decPart;
  }

  return (isNegative ? '-₹' : '₹') + result;
}

function maskAccountNumber(number) {
  if (!number || number.length < 4) return '****';
  const last4 = number.slice(-4);
  return '**** **** ' + last4;
}

function calculatePercentageChange(oldVal, newVal) {
  if (oldVal === 0) return newVal > 0 ? 100 : 0;
  const change = ((newVal - oldVal) / Math.abs(oldVal)) * 100;
  return Math.round(change * 100) / 100;
}

module.exports = { formatCurrency, maskAccountNumber, calculatePercentageChange };
