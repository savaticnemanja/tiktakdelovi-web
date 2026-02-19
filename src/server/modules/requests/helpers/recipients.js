const normalizeMakeKey = (make) =>
  make ? String(make).trim().toLowerCase() : "";

const resolveMakeNumbers = (numbersByMake, normalizedMake) => {
  if (!numbersByMake || typeof numbersByMake !== "object" || !normalizedMake) {
    return [];
  }

  if (Array.isArray(numbersByMake[normalizedMake])) {
    return numbersByMake[normalizedMake];
  }

  const matchedMakeKey = Object.keys(numbersByMake).find(
    (makeKey) => String(makeKey).trim().toLowerCase() === normalizedMake,
  );

  return matchedMakeKey && Array.isArray(numbersByMake[matchedMakeKey])
    ? numbersByMake[matchedMakeKey]
    : [];
};

export const resolveRecipients = ({
  city,
  make,
  numbersByCity,
  numbersByCityByMake,
  fallbackNumbers,
}) => {
  const normalizedMake = normalizeMakeKey(make);
  const cityNumbersByMake =
    city && numbersByCityByMake ? numbersByCityByMake[city] : null;
  const makeNumbers = resolveMakeNumbers(cityNumbersByMake, normalizedMake);

  if (makeNumbers.length) {
    return makeNumbers;
  }

  const cityNumbers = city && numbersByCity ? numbersByCity[city] : null;
  if (Array.isArray(cityNumbers) && cityNumbers.length) {
    return cityNumbers;
  }
  return Array.isArray(fallbackNumbers) ? fallbackNumbers : [];
};

export const resolveRecipientsByMake = ({ make, numbersByCityByMake }) => {
  const normalizedMake = normalizeMakeKey(make);
  if (!normalizedMake || !numbersByCityByMake) {
    return [];
  }

  const recipients = Object.values(numbersByCityByMake).flatMap((numbersByMake) =>
    resolveMakeNumbers(numbersByMake, normalizedMake),
  );

  return [...new Set(recipients.map((entry) => String(entry).trim()).filter(Boolean))];
};
