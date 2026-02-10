export const formatBuyerReviewMessage = ({
  bidId,
  bidDetails,
  bidNote,
}) => `POTREBNE SU DODATNE INFORMACIJE ZA ZAHTEV #${bidId}

Poštovani, prodavac je zatražio dodatne informacije za zahtev #${bidId}

Detalji zahteva: ${bidDetails}

Napomena od prodavca: ${bidNote}

Da odgovorite kliknite na dugme ispod i ostavite potrebne informacije.`;

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

Da prihvatite ponudu kliknite na dugme ispod i ostavite detalje za isporuku.`;

export const formatBuyerRoadsideOfferMessage = ({
  bidId,
  bidDetails,
  bidOffer,
}) => `PONUDA ZA POMOĆ NA PUTU br. #${bidId}

Poštovani, pomoć na putu je ponudila cenu za Vaš zahtev br. #${bidId}

Detalji zahteva: ${bidDetails}

Cena: ${bidOffer}

Da prihvatite ponudu kliknite na dugme ispod i ostavite detalje za isporuku.`;

export const formatBuyerImageCaption = ({ bidId, bidOffer }) => {
  const priceLine = bidOffer ? `\n\nCena - ${bidOffer}` : "";
  return `Slika dela za zahtev #${bidId}${priceLine}`;
};
