import { createWebhookResponders } from "../responders.js";
import { createImageHandler } from "./imageHandler.js";
import { createButtonHandler } from "./buttonHandler.js";
import { createInteractiveHandler } from "./interactiveHandler.js";
import { createTextHandler } from "./textHandler.js";

export const createWebhookHandlers = ({
  bidStore,
  messageToBid,
  metaClient,
  telegramClient,
  ownerNumber,
  courierNumber,
  sellerNumbers,
  sellerNumbersByCityByMake,
  sellerMarkupPercent,
}) => {
  const { notifyRoadsideAcceptance } = createWebhookResponders({
    metaClient,
    ownerNumber,
  });

  const handleImageMessage = createImageHandler({
    bidStore,
    metaClient,
    telegramClient,
    sellerNumbers,
    sellerNumbersByCityByMake,
  });

  const handleButtonMessage = createButtonHandler({
    bidStore,
    messageToBid,
    metaClient,
    telegramClient,
    ownerNumber,
    courierNumber,
    notifyRoadsideAcceptance,
  });

  const handleInteractiveMessage = createInteractiveHandler({
    bidStore,
    messageToBid,
    metaClient,
    telegramClient,
    ownerNumber,
    sellerMarkupPercent,
    notifyRoadsideAcceptance,
  });

  const handleTextMessage = createTextHandler({
    bidStore,
    metaClient,
    sellerMarkupPercent,
  });

  return {
    handleImageMessage,
    handleButtonMessage,
    handleInteractiveMessage,
    handleTextMessage,
  };
};
