export const formatBuyerReviewMessage = ({
  bidId,
  bidDetails,
  bidNote,
}) => `POTREBNE SU DODATNE INFORMACIJE ZA ZAHTEV #${bidId}

Poštovani, prodavac je zatražio dodatne informacije za zahtev #${bidId}

Detalji zahteva: ${bidDetails}

Napomena od prodavca: ${bidNote}

Pošaljite dodatne informacije kao odgovor na ovu poruku.`;

export const formatBuyerOfferMessage = ({
  bidId,
  bidDetails,
  bidOffer,
  bidNote,
}) => `PONUDA ZA ZAHTEV #${bidId}

Poštovani, prodavac je ponudio cenu za Vaš zahtev br. #${bidId}

Detalji zahteva: ${bidDetails}

Cena: ${bidOffer}
Napomena: ${bidNote}

Kliknite na dugme ispod i unesite podatke kroz korake.`;

export const formatBuyerRoadsideOfferMessage = ({
  bidId,
  bidDetails,
  bidOffer,
}) => `PONUDA ZA POMOĆ NA PUTU br. #${bidId}

Poštovani, pomoć na putu je ponudila cenu za Vaš zahtev br. #${bidId}

Detalji zahteva: ${bidDetails}

Cena: ${bidOffer}

Kliknite na dugme ispod i unesite podatke kroz korake.`;

export const formatBuyerMechanicOfferMessage = ({
  bidId,
  bidDetails,
  bidOffer,
  bidDate,
  bidNote,
}) => `PONUDA ZA SERVIS #${bidId}

Poštovani, mehaničar je poslao ponudu za zahtev #${bidId}

Detalji zahteva: ${bidDetails}

Cena: ${bidOffer}
Termin: ${bidDate}
Napomena: ${bidNote}

Kliknite na dugme ispod za prihvatanje ili odbijanje ponude.`;

export const formatBuyerMechanicNotificationMessage = ({
  bidId,
  make,
  model,
  year,
  fuelType,
  mechanicContact,
  bidOffer,
  bidDate,
  bidTime,
  bidNote,
}) => `KONTAKT MEHANIČARA ZA ZAHTEV #${bidId}

Vozilo: ${make} ${model}, ${year}, ${fuelType}
Kontakt mehaničara: ${mechanicContact}
Cena: ${bidOffer}
Datum: ${bidDate}
Vreme: ${bidTime}
Napomena: ${bidNote}`;

export const formatBuyerImageCaption = ({ bidId, bidOffer }) => {
  const priceLine = bidOffer ? `\n\nCena - ${bidOffer}` : "";
  return `Slika dela za zahtev #${bidId}${priceLine}`;
};
