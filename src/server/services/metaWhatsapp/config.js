export const META_GRAPH_VERSION = "v24.0";

export const graphBaseUrl = (version = META_GRAPH_VERSION) =>
  `https://graph.facebook.com/${version}`;
