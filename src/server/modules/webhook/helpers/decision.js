export const applyDecision = (bidStore, bidId, status, source) =>
  bidStore.setBuyerDecision(bidId, { status, source });
