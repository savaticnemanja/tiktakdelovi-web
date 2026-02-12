export const createMessageBidMap = () => {
  const map = new Map();

  const set = (messageId, bidId) => {
    if (!messageId || !bidId) {
      return;
    }
    map.set(messageId, bidId);
  };

  const get = (messageId) => {
    if (!messageId) {
      return null;
    }
    return map.get(messageId) || null;
  };

  return { set, get };
};
