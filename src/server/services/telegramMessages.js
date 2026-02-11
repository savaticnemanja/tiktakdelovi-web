export const formatBuyerReviewMessage = ({
  bidId,
  bidDetails,
  bidNote,
}) => `POTREBNE SU DODATNE INFORMACIJE ZA ZAHTEV #${bidId}

Poštovani, prodavac je zatražio dodatne informacije za zahtev #${bidId}

Detalji zahteva: ${bidDetails}

Napomena od prodavca: ${bidNote}

Odgovor pošaljite ovako:
/info Vaše dodatne informacije`;

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

Pošaljite podatke ovako:
/odgovor
ime: Ime Prezime
kontakt: +3816...
adresa: Ulica 1
grad: Beograd
postanski_broj: 11000`;

export const formatBuyerRoadsideOfferMessage = ({
  bidId,
  bidDetails,
  bidOffer,
}) => `PONUDA ZA POMOĆ NA PUTU br. #${bidId}

Poštovani, pomoć na putu je ponudila cenu za Vaš zahtev br. #${bidId}

Detalji zahteva: ${bidDetails}

Cena: ${bidOffer}

Pošaljite odgovor ovako:
/odgovor
prihvatam: da
ime: Ime Prezime
kontakt: +3816...
adresa: Ulica 1
grad: Beograd
postanski_broj: 11000`;

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

export const formatBuyerImageCaption = ({ bidId, bidOffer }) => {
  const priceLine = bidOffer ? `\n\nCena - ${bidOffer}` : "";
  return `Slika dela za zahtev #${bidId}${priceLine}`;
};
