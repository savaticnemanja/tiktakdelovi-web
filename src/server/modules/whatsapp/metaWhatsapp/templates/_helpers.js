export const textParam = (parameterName, text) => ({
  type: "text",
  parameter_name: parameterName,
  text,
});

export const flowButton = (screenTitle) => ({
  type: "button",
  sub_type: "flow",
  index: "0",
  parameters: [
    {
      type: "payload",
      payload: flowPayload(screenTitle),
    },
  ],
});

export const flowPayload = (screenTitle) => JSON.stringify({ screen: screenTitle });

export const quickReplyButton = (index, payload) => ({
  type: "button",
  sub_type: "quick_reply",
  index: String(index),
  parameters: [
    {
      type: "payload",
      payload: quickReplyPayload(payload),
    },
  ],
});

export const quickReplyPayload = (payload) => JSON.stringify(payload);

export const trackSent = (messageToBid, metaResp, bidId, kind) => {
  const sentId = metaResp?.data?.messages?.[0]?.id;
  if (sentId && messageToBid) {
    messageToBid.set(sentId, { bidId, kind });
  }
};

export const requireFields = (context, fields) => {
  const missing = Object.entries(fields)
    .filter(([, value]) => !value)
    .map(([key]) => key);
  if (missing.length > 0) {
    const prefix = context ? `${context}: ` : "";
    throw new Error(`${prefix}${missing.join(", ")} ${missing.length === 1 ? "is" : "are"} required.`);
  }
};

export const sanitizeFields = (values, sanitizerMap) => {
  const output = {};
  for (const [key, sanitizer] of Object.entries(sanitizerMap)) {
    output[key] = sanitizer(values[key]);
  }
  return output;
};

export const validateInput = (context, values, schema) => {
  const errors = [];
  for (const [field, rules] of Object.entries(schema)) {
    const value = values[field];
    if (rules.required && (value === undefined || value === null)) {
      errors.push(`${field} is required`);
      continue;
    }
    if (value !== undefined && value !== null && rules.types?.length) {
      const valueType = typeof value;
      if (!rules.types.includes(valueType)) {
        errors.push(`${field} must be ${rules.types.join(" or ")}`);
      }
    }
  }
  if (errors.length > 0) {
    const prefix = context ? `${context}: ` : "";
    throw new Error(`${prefix}${errors.join("; ")}.`);
  }
};
