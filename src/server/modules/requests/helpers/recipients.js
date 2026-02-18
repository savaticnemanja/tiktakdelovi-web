export const resolveRecipients = ({
  city,
  make,
  numbersByCity,
  numbersByCityByMake,
  fallbackNumbers,
}) => {
  const normalizedMake = make ? String(make).trim().toLowerCase() : "";
  const cityNumbersByMake =
    city && numbersByCityByMake ? numbersByCityByMake[city] : null;

  if (
    normalizedMake &&
    cityNumbersByMake &&
    Array.isArray(cityNumbersByMake[normalizedMake]) &&
    cityNumbersByMake[normalizedMake].length
  ) {
    return cityNumbersByMake[normalizedMake];
  }

  const cityNumbers = city && numbersByCity ? numbersByCity[city] : null;
  if (Array.isArray(cityNumbers) && cityNumbers.length) {
    return cityNumbers;
  }
  return Array.isArray(fallbackNumbers) ? fallbackNumbers : [];
};
