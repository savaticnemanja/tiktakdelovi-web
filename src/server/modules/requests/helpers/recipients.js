export const resolveRecipients = ({ city, numbersByCity, fallbackNumbers }) => {
  const cityNumbers = city && numbersByCity ? numbersByCity[city] : null;
  if (Array.isArray(cityNumbers) && cityNumbers.length) {
    return cityNumbers;
  }
  return Array.isArray(fallbackNumbers) ? fallbackNumbers : [];
};
